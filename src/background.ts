import { BASE_PROPERTIES, SERVICES } from './constants';
import { initAnalytics, sendEvent } from './analytics';
import { storage } from './storage';
import config from './config';

const getItemStorageKey = (namespace, id) => {
  return `item_${namespace}_${id}`;
};

const getNamespaceFromStorageKey = (key) => {
  const parts = key.split('_');

  return parts.length > 1 ? parts[1] : null;
};

const getDisqusIdentifier = (namespace, id) => {
  return `${namespace}_${id}`;
};

const getIsNewState = (lastSavedItem, item, propertiesToCheck) => {
  if (lastSavedItem === null) {
    return true;
  }

  for (const propertyToCheck of propertiesToCheck) {
    if (lastSavedItem[propertyToCheck] !== item[propertyToCheck]) {
      return true;
    }
  }

  return false;
};

const getCommentsCount = (namespace, ids, cb) => {
  const idsParam = ids.map(id => `&thread[]=ident:/${getDisqusIdentifier(namespace, id)}`).join('');
  const apiKey = 'E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F';
  const xhr = new XMLHttpRequest();
  xhr.open("GET", `https://disqus.com/api/3.0/threads/set.json?forum=meerkat-for-a-transparent-market&api_key=${apiKey}${idsParam}`, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      let threads = [];

      try {
        threads = JSON.parse(xhr.responseText).response;
      } catch(e) { }

      const countMap = {};

      for (const thread of threads) {
        const id = thread.identifiers[0].replace(/^\//, '').replace(`${namespace}_`, '');

        countMap[id] = thread.posts;
      }

      const result = {};

      for (const id of ids) {
        result[id] = countMap[id] ? countMap[id] : 0;
      }

      cb(result);
    }
  };
  xhr.send();
};

const getStoreVersion = async () => {
  const result = await storage.get('version');

  return result.version || 1;
};

const setStoreVersion = async (version) => {
  await storage.set({ version: version });
};

const migrate1to2 = async () => {
  const items = await storage.get(null);

  const newItems = {};

  for (const itemKey of Object.keys(items)) {
    if (itemKey.indexOf('item_') === 0) {
      newItems[itemKey] = { history: items[itemKey] };
    }
  }

  await storage.set(newItems);
};

const migrate = async () => {
  const version = await getStoreVersion();

  if (version === 1) {
    await migrate1to2();

    await setStoreVersion(2);
  }
};

const getList = async (sendResponse, namespace, propertiesToCheck, version, items, timestamp) => {
  const originalOrder = items.map(item => item[BASE_PROPERTIES.ID]);

  const savedItems = await storage.get(items.map(item => getItemStorageKey(namespace, item[BASE_PROPERTIES.ID])));

  for (const item of items) {
    const key = getItemStorageKey(namespace, item[BASE_PROPERTIES.ID]);

    if (!savedItems[key]) {
      savedItems[key] = { history: [] };
    }

    const savedItemHistory = savedItems[key].history;

    if (getIsNewState(
      savedItemHistory.length === 0 ? null : savedItemHistory[savedItemHistory.length - 1],
      item,
      propertiesToCheck
    )) {
      savedItemHistory.push({
        ...item,
        [BASE_PROPERTIES.CREATED_TIMESTAMP]: timestamp,
        [BASE_PROPERTIES.UPDATED_TIMESTAMP]: null,
        [BASE_PROPERTIES.VERSION]: version
      });
    } else {
      savedItemHistory[savedItemHistory.length - 1][BASE_PROPERTIES.UPDATED_TIMESTAMP] = timestamp;
    }
  }

  await storage.set(savedItems);

  const itemsHistory = Object.values(savedItems).map(savedItem => savedItem.history);

  itemsHistory.sort((a, b) => {
    const aIndex = originalOrder.indexOf(a[0][BASE_PROPERTIES.ID]);
    const bIndex = originalOrder.indexOf(b[0][BASE_PROPERTIES.ID]);

    if (aIndex === bIndex) {
      return 0;
    }

    return aIndex > bIndex ? 1 : -1;
  });

  getCommentsCount(
    namespace,
    itemsHistory.map(history => history[0][BASE_PROPERTIES.ID]),
    (commentCountMap) => {
      const itemObjects = itemsHistory.map(history => ({
        history: history,
        commentCount: commentCountMap[history[0][BASE_PROPERTIES.ID]]
      }));

      sendResponse({ items: itemObjects });
    }
  );
};

const getNamespacesInfo = async (sendResponse) => {
  const items = await storage.get(null);

  const namespaces = {};

  for (const itemKey of Object.keys(items)) {
    const namespace = getNamespaceFromStorageKey(itemKey);

    if (namespace === null) {
      continue;
    }

    if (!namespaces[namespace]) {
      namespaces[namespace] = {
        keys: [],
        megaBytesInUse: null
      };
    }

    namespaces[namespace].keys.push(itemKey);
  }

  for (const namespace of Object.keys(namespaces)) {
    const bytesInUse = await storage.getBytesInUse(namespaces[namespace].keys);

    namespaces[namespace].megaBytesInUse = Math.round((bytesInUse / 1024 / 1024) * 100) / 100;
  }

  sendResponse({
    namespaces: Object.keys(namespaces).map(namespace => {
      return {
        name: namespace,
        megaBytesInUse: namespaces[namespace].megaBytesInUse
      };
    })
  });
};

const clearNamespace = async (sendResponse, namespace) => {
  const items = await storage.get(null);

  const keys = [];

  for (const itemKey of Object.keys(items)) {
    const namespaceFromKey = getNamespaceFromStorageKey(itemKey);

    if (namespaceFromKey === namespace) {
      keys.push(itemKey);
    }
  }

  await storage.remove(keys);

  sendResponse({ success: true });
};

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.message === SERVICES.GET_LIST) {
      sendEvent('extension', 'getList', request.namespace);

      getList(sendResponse, request.namespace, request.propertiesToCheck, request.version, request.items, (new Date()).getTime());

      return true;
    } else if (request.message === SERVICES.GET_NAMESPACES_INFO) {
      getNamespacesInfo(sendResponse);

      return true;
    } else if (request.message === SERVICES.CLEAR_NAMESPACE) {
      clearNamespace(sendResponse, request.namespace);

      return true;
    } else if (request.message === SERVICES.OPEN_COMMENTS) {
      sendEvent('extension', 'openComments', request.namespace);

      const width = 900;
      const height = 700;
      const left = (screen.width - width) / 2;
      const top = (screen.height - height) / 2;

      const data = {
        disqusIdentifier: getDisqusIdentifier(request.namespace, request.id),
        language: request.language,
        title: request.title,
        description: request.description,
        picture: request.picture
      };

      window.open(
        `popup.html?data=${encodeURIComponent(JSON.stringify(data))}`,
        'extension_popup',
        `width=${width},height=${height},top=${top},left=${left}`
      );

      return true;
    }
  }
);

migrate();

initAnalytics();

if (config.buildEnv === 'production') {
  chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === 'install') {
      chrome.tabs.create({
        url: 'https://siloor.github.io/meerkat-for-a-transparent-market/installed/'
      });
    } else if (details.reason === 'update') {
      chrome.tabs.create({
        url: 'https://siloor.github.io/meerkat-for-a-transparent-market/upgraded/'
      });
    }
  });
}
