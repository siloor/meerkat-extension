import { BASE_PROPERTIES, SERVICES, PROPERTY_TYPES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getToolbar } from '../dic';

const NAMESPACE = 'hasznaltauto.hu';

const PROPERTIES = {
  TITLE: 'title',
  PRICE: 'price',
  URL: 'url',
  PICTURE: 'picture',
  DESCRIPTION: 'description'
};

const propertiesToCheck = [
  { name: PROPERTIES.TITLE, title: 'Cím', type: PROPERTY_TYPES.TEXT },
  { name: PROPERTIES.PRICE, title: 'Ár', type: PROPERTY_TYPES.NUMBER },
  { name: PROPERTIES.URL, title: 'Url', type: PROPERTY_TYPES.URL },
  { name: PROPERTIES.PICTURE, title: 'Kép', type: PROPERTY_TYPES.IMAGE },
  { name: PROPERTIES.DESCRIPTION, title: 'Leírás', type: PROPERTY_TYPES.TEXT }
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
  if (window.location.pathname.indexOf('/talalatilista') === 0) {
    const items = [].slice.call(document.getElementsByClassName('talalati-sor'));

    chrome.runtime.sendMessage({
      message: SERVICES.GET_LIST,
      items: items.map(item => getItemData(item)),
      namespace: NAMESPACE,
      propertiesToCheck: propertiesToCheck.map(property => property.name),
      version: 1
    }, (response) => {
      for (let i = 0; i < items.length; i++) {
        const div = document.createElement('div');

        div.style.float = 'left';
        div.style.width = '100%';

        items[i].appendChild(div);

        getToolbar().initToolbar(div, response.items[i], propertiesToCheck, stringToPrice, openComments);
      }
    });
  }
};

start();
