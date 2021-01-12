import { BASE_PROPERTIES, SERVICES, PROPERTY_TYPES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getLanguage, getTranslations } from '../translations';
import { getToolbar } from '../dic';

const NAMESPACE = 'hasznaltauto.hu';

const PROPERTIES = {
  TITLE: 'title',
  PRICE: 'price',
  URL: 'url',
  PICTURE: 'picture',
  DESCRIPTION: 'description'
};

const translations = getTranslations({
  en: {
    [PROPERTIES.TITLE]: 'Title',
    [PROPERTIES.PRICE]: 'Price',
    [PROPERTIES.URL]: 'Url',
    [PROPERTIES.PICTURE]: 'Picture',
    [PROPERTIES.DESCRIPTION]: 'Description'
  },
  hu: {
    [PROPERTIES.TITLE]: 'Cím',
    [PROPERTIES.PRICE]: 'Ár',
    [PROPERTIES.URL]: 'Url',
    [PROPERTIES.PICTURE]: 'Kép',
    [PROPERTIES.DESCRIPTION]: 'Leírás'
  }
});

const propertiesToCheck = [
  { name: PROPERTIES.TITLE, title: translations[PROPERTIES.TITLE], type: PROPERTY_TYPES.TEXT },
  { name: PROPERTIES.PRICE, title: translations[PROPERTIES.PRICE], type: PROPERTY_TYPES.NUMBER },
  { name: PROPERTIES.URL, title: translations[PROPERTIES.URL], type: PROPERTY_TYPES.URL },
  { name: PROPERTIES.PICTURE, title: translations[PROPERTIES.PICTURE], type: PROPERTY_TYPES.IMAGE },
  { name: PROPERTIES.DESCRIPTION, title: translations[PROPERTIES.DESCRIPTION], type: PROPERTY_TYPES.TEXT }
];

const getId = (path) => {
  const parts = path.split('/');

  if (parts.length < 5) {
    return null;
  }

  const id = parts[4].split('-');

  return id[id.length - 1];
};

const getDescription = (item) => {
  const div = document.createElement('div');

  div.innerHTML = item.querySelector('.talalatisor-infokontener').innerHTML;

  div.querySelector('.tavolsaginfo').remove();
  div.querySelector('.talalatisor-hirkod').remove();

  return removeUnnecessaryWhitespace(textContentWithSeparator(div));
};

const getItemData = (item) => {
  const link = item.querySelector('h3 a');

  return {
    [BASE_PROPERTIES.ID]: getId(link.pathname),
    [PROPERTIES.TITLE]: link.textContent,
    [PROPERTIES.PRICE]: item.querySelector('.vetelar').textContent,
    [PROPERTIES.URL]: link.href,
    [PROPERTIES.PICTURE]: item.querySelector('.talalatisor-kep a img').getAttribute('data-lazyurl'),
    [PROPERTIES.DESCRIPTION]: getDescription(item)
  };
};

const stringToPrice = (price) => {
  const value = parseFloat(price.replace(/(?!-)[^0-9.]/g, ''));

  return {
    value: isNaN(value) ? null : value,
    currency: isNaN(value) ? null : removeUnnecessaryWhitespace(price.replace(/[0-9.-]/g, ''))
  };
};

const callService = (name, data) => {
  return new Promise((resolve, reject) => {
    const message = {
      message: name,
      ...data
    };

    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
};

const openComments = (item) => {
  const state = item.history[item.history.length - 1];

  return callService(SERVICES.OPEN_COMMENTS, {
    namespace: NAMESPACE,
    language: getLanguage(),
    id: state[BASE_PROPERTIES.ID],
    title: state[PROPERTIES.TITLE],
    description: state[PROPERTIES.DESCRIPTION],
    picture: state[PROPERTIES.PICTURE]
  });
};

const setColor = (item, color) => {
  const state = item.history[item.history.length - 1];

  return callService(SERVICES.SET_COLOR, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    color: color
  });
};

const addFlag = (item, title) => {
  const state = item.history[item.history.length - 1];

  return callService(SERVICES.ADD_FLAG, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    title: title
  });
};

const removeFlag = (item, title) => {
  const state = item.history[item.history.length - 1];

  return callService(SERVICES.REMOVE_FLAG, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    title: title
  });
};

const getFlags = async (item) => {
  const state = item.history[item.history.length - 1];

  return callService(SERVICES.GET_FLAGS, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID]
  });
};

const start = async () => {
  if (window.location.pathname.indexOf('/talalatilista') === 0) {
    const styleDiv = document.createElement('div');

    styleDiv.innerHTML = `
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
    `;

    document.body.appendChild(styleDiv);

    const items = [].slice.call(document.getElementsByClassName('talalati-sor'));

    const response: any = await callService(SERVICES.GET_LIST, {
      items: items.map(item => getItemData(item)),
      namespace: NAMESPACE,
      propertiesToCheck: propertiesToCheck.map(property => property.name),
      version: 1
    });

    for (let i = 0; i < items.length; i++) {
      const div = document.createElement('div');

      const shadow = div.attachShadow({ mode: 'closed' });

      div.style.float = 'left';
      div.style.width = '100%';

      items[i].appendChild(div);

      getToolbar().initToolbar(
        shadow,
        response.items[i],
        response.currentDatetime,
        propertiesToCheck,
        stringToPrice,
        openComments,
        setColor,
        addFlag,
        removeFlag,
        getFlags
      );
    }
  }
};

start();
