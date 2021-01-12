import { BASE_PROPERTIES, SERVICES, PROPERTY_TYPES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getLanguage, getTranslations } from '../translations';
import { getToolbar } from '../dic';

const NAMESPACE = 'ingatlan.com';

const PROPERTIES = {
  PRICE: 'price',
  URL: 'url',
  PICTURE: 'picture',
  DESCRIPTION: 'description'
};

const translations = getTranslations({
  en: {
    [PROPERTIES.PRICE]: 'Price',
    [PROPERTIES.URL]: 'Url',
    [PROPERTIES.PICTURE]: 'Picture',
    [PROPERTIES.DESCRIPTION]: 'Description'
  },
  hu: {
    [PROPERTIES.PRICE]: 'Ár',
    [PROPERTIES.URL]: 'Url',
    [PROPERTIES.PICTURE]: 'Kép',
    [PROPERTIES.DESCRIPTION]: 'Leírás'
  }
});

const propertiesToCheck = [
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

  return parts[4];
};

const getDescription = (item) => {
  const div = document.createElement('div');

  div.innerHTML = item.querySelector('.listing__link').innerHTML;

  div.querySelector('.listing__price').remove();

  return removeUnnecessaryWhitespace(textContentWithSeparator(div));
};

const getItemData = (item) => {
  const picture = item.querySelector('.listing__thumbnail img');
  const link = item.querySelector('.listing__link');

  return {
    [BASE_PROPERTIES.ID]: getId(link.pathname),
    [PROPERTIES.PRICE]: item.querySelector('.price').textContent.trim(),
    [PROPERTIES.URL]: link.href,
    [PROPERTIES.PICTURE]: picture ? picture.getAttribute('src') : null,
    [PROPERTIES.DESCRIPTION]: getDescription(item)
  };
};

const stringToPrice = (price) => {
  const isMillion = price.indexOf(' M ') !== -1;

  if (isMillion) {
    price = price.replace(/ M /, ' ');
  }

  return {
    value: parseFloat(price.replace(/(?!-)[^0-9.]/g, '')) * (isMillion ? 1000000 : 1),
    currency: removeUnnecessaryWhitespace(price.replace(/[0-9.-]/g, ''))
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
    title: '',
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
  if (window.location.pathname.indexOf('/lista') === 0 || window.location.pathname.indexOf('/szukites') === 0) {
    const styleDiv = document.createElement('div');

    styleDiv.innerHTML = `
      <link rel="preconnect" href="https://fonts.gstatic.com" />
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
    `;

    document.body.appendChild(styleDiv);

    const items = [].slice.call(document.getElementsByClassName('listing'));

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
      div.style.position = 'relative';
      div.style.zIndex = '107';

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
