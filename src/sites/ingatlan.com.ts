import { BASE_PROPERTIES, SERVICES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getToolbar } from '../dic';

const NAMESPACE = 'ingatlan.com';

const PROPERTIES = {
  PRICE: 'price',
  URL: 'url',
  PICTURE: 'picture',
  DESCRIPTION: 'description'
};

const propertiesToCheck = [
  PROPERTIES.PRICE,
  PROPERTIES.URL,
  PROPERTIES.PICTURE,
  PROPERTIES.DESCRIPTION
];

const propertiesToCheckTranslations = {
  [PROPERTIES.PRICE]: 'Ár',
  [PROPERTIES.URL]: 'Url',
  [PROPERTIES.PICTURE]: 'Kép',
  [PROPERTIES.DESCRIPTION]: 'Leírás'
};

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

const openComments = (item) => {
  const state = item.history[item.history.length - 1];

  chrome.runtime.sendMessage({
    message: SERVICES.OPEN_COMMENTS,
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    title: '',
    description: state[PROPERTIES.DESCRIPTION],
    picture: state[PROPERTIES.PICTURE]
  }, (response) => {});
};

const start = () => {
  if (window.location.pathname.indexOf('/lista') === 0 || window.location.pathname.indexOf('/szukites') === 0) {
    const items = [].slice.call(document.getElementsByClassName('listing'));

    chrome.runtime.sendMessage({
      message: SERVICES.GET_LIST,
      items: items.map(item => getItemData(item)),
      namespace: NAMESPACE,
      propertiesToCheck: propertiesToCheck,
      version: 1
    }, (response) => {
      for (let i = 0; i < items.length; i++) {
        const div = document.createElement('div');

        div.style.float = 'left';
        div.style.width = '100%';
        div.style.position = 'relative';
        div.style.zIndex = '150';

        items[i].appendChild(div);

        getToolbar().initToolbar(div, response.items[i], propertiesToCheck, propertiesToCheckTranslations, stringToPrice, openComments);
      }
    });
  }
};

start();
