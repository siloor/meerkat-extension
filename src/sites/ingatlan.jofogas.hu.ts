import { BASE_PROPERTIES, SERVICES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getToolbar } from '../dic';

const NAMESPACE = 'ingatlan.jofogas.hu';

const PROPERTIES = {
  TITLE: 'title',
  PRICE: 'price',
  URL: 'url',
  PICTURE: 'picture',
  DESCRIPTION: 'description'
};

const propertiesToCheck = [
  { name: PROPERTIES.TITLE, title: 'Cím' },
  { name: PROPERTIES.PRICE, title: 'Ár' },
  { name: PROPERTIES.URL, title: 'Url' },
  { name: PROPERTIES.PICTURE, title: 'Kép' },
  { name: PROPERTIES.DESCRIPTION, title: 'Leírás' }
];

const getId = (path) => {
  return path.split('/').pop().split('.').slice(0, -1).join('.').split('_').pop();
};

const getDescription = (item) => {
  return removeUnnecessaryWhitespace([
    textContentWithSeparator(item.querySelector('.sizeRooms')),
    textContentWithSeparator(item.querySelector('.cityname'))
  ].join(' '));
};

const getItemData = (item) => {
  const link = item.querySelector('.item-title a');

  return {
    [BASE_PROPERTIES.ID]: getId(link.pathname),
    [PROPERTIES.TITLE]: link.textContent.trim(),
    [PROPERTIES.PRICE]: removeUnnecessaryWhitespace(item.querySelector('.item-price').textContent),
    [PROPERTIES.URL]: link.href,
    [PROPERTIES.PICTURE]: item.querySelector('.imageBox img').getAttribute('data-src'),
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

const openComments = (item) => {
  const state = item.history[item.history.length - 1];

  chrome.runtime.sendMessage({
    message: SERVICES.OPEN_COMMENTS,
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    title: state[PROPERTIES.TITLE],
    description: state[PROPERTIES.DESCRIPTION],
    picture: state[PROPERTIES.PICTURE]
  }, (response) => {});
};

const start = () => {
  const list = document.getElementsByClassName('list-items');

  if (list.length) {
    const items = [].slice.call(list[0].getElementsByClassName('list-item'));

    chrome.runtime.sendMessage({
      message: SERVICES.GET_LIST,
      items: items.map(item => getItemData(item)),
      namespace: NAMESPACE,
      propertiesToCheck: propertiesToCheck.map(property => property.name),
      version: 1
    }, (response) => {
      for (let i = 0; i < items.length; i++) {
        const div = document.createElement('div');

        div.style.position = 'absolute';
        div.style.bottom = '0px';

        items[i].getElementsByClassName('contentArea')[0].appendChild(div);

        getToolbar().initToolbar(div, response.items[i], propertiesToCheck, stringToPrice, openComments);
      }
    });
  }
};

start();
