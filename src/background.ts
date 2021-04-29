import { BASE_PROPERTIES, SERVICES, RUN_CONTENT_SCRIPT } from './constants';
import { initAnalytics, sendEvent } from './analytics';
import { storage } from './storage';
import config from './config';

let token = null;

const getItemStorageKey = (namespace, id) => {
  return `item_${namespace}_${id}`;
};

const getNamespaceFromStorageKey = (key) => {
  const parts = key.split('_');

  return parts.length > 1 ? parts[1] : null;
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

const getListData = async (token, namespace, items) => {
  const params = new URLSearchParams();

  params.append('token', token);
  params.append('namespace', namespace);

  for (const item of items) {
    params.append('items[]', item[BASE_PROPERTIES.ID]);
  }

  try {
    const response = await fetch(`https://siloor.com/meerkat/api/list?${params}`);
    const data = await response.json();

    return {
      currentDatetime: new Date(data.data.current_datetime),
    };
  } catch(e) { }

  return null;
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

const generateRandomString = (length) => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

const setToken = async () => {
  const result = await storage.get('token');

  if (result.token) {
    token = result.token;
  } else {
    token = generateRandomString(40);

    await storage.set({ token: token });
  }
};

const migrate = async () => {
  const version = await getStoreVersion();

  if (version === 1) {
    await migrate1to2();

    await setStoreVersion(2);
  }
};

const getSiteScript = (url) => {
  const sites = [
    {
      matches: ['.*://.*\\.hasznaltauto\\.hu/.*'],
      js: ['sites/hasznaltauto.hu.js']
    },
    {
      matches: ['.*://.*\\.ingatlan\\.com/.*'],
      js: ['sites/ingatlan.com.js']
    },
    {
      matches: ['.*://ingatlan\\.jofogas\\.hu/.*'],
      js: ['sites/ingatlan.jofogas.hu.js']
    },
    {
      matches: ['.*://suchen\\.mobile\\.de/.*'],
      js: ['sites/mobile.de.js']
    },
    {
      matches: ['.*://www\\.immobilienscout24\\.de/.*'],
      js: ['sites/immobilienscout24.de.js']
    },
  ];

  const site = sites.find((site) => {
    return site.matches.find((regex) => {
      return url.match(regex);
    });
  });

  return site ? site.js[0] : null;
};

const getList = async (sendResponse, token, namespace, propertiesToCheck, version, items) => {
  const { currentDatetime } = await getListData(token, namespace, items);
  const timestamp = currentDatetime.getTime();

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

  const savedItemsValues = Object.values(savedItems);

  const newItems = originalOrder.map((originalOrderId) => {
    for (const savedItemValue of savedItemsValues) {
      if (savedItemValue.history[0][BASE_PROPERTIES.ID] === originalOrderId) {
        return savedItemValue;
      }
    }

    return null;
  });

  const itemObjects = newItems.map(item => ({
    history: item.history,
    color: item.color,
    note: item.note
  }));

  sendResponse({
    items: itemObjects,
    currentDatetime: currentDatetime
  });
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

const setColor = async (sendResponse, namespace, id, color) => {
  const itemKey = getItemStorageKey(namespace, id);

  const item = (await storage.get(itemKey))[itemKey];

  if (color === null) {
    delete item.color;
  } else {
    item.color = color;
  }

  await storage.set({ [itemKey]: item });

  sendResponse();
};

const setNote = async (sendResponse, namespace, id, note) => {
  const itemKey = getItemStorageKey(namespace, id);

  const item = (await storage.get(itemKey))[itemKey];

  if (note === null) {
    delete item.note;
  } else {
    item.note = note;
  }

  await storage.set({ [itemKey]: item });

  sendResponse();
};

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.message === SERVICES.GET_LIST) {
      sendEvent('extension', 'getList', request.namespace);

      getList(sendResponse, token, request.namespace, request.propertiesToCheck, request.version, request.items);

      return true;
    } else if (request.message === SERVICES.GET_NAMESPACES_INFO) {
      getNamespacesInfo(sendResponse);

      return true;
    } else if (request.message === SERVICES.CLEAR_NAMESPACE) {
      clearNamespace(sendResponse, request.namespace);

      return true;
    } else if (request.message === SERVICES.SET_COLOR) {
      setColor(sendResponse, request.namespace, request.id, request.color);

      return true;
    } else if (request.message === SERVICES.SET_NOTE) {
      setNote(sendResponse, request.namespace, request.id, request.note);

      return true;
    } else if (request.message === RUN_CONTENT_SCRIPT) {
      const siteScript = getSiteScript(sender.url);

      if (siteScript) {
        chrome.tabs.executeScript(
          sender.tab.id,
          {
            file: 'toolbar.js'
          }
        );

        chrome.tabs.executeScript(
          sender.tab.id,
          {
            file: siteScript
          }
        );
      }

      return true;
    }
  }
);

setToken();

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

chrome.browserAction.disable();
