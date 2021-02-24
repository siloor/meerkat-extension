import { BASE_PROPERTIES, SERVICES, PROPERTY_TYPES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getLanguage, getTranslations } from '../translations';
import { getToolbar } from '../dic';
import { callService, addCustomFont, getItemCurrentState, setColor, addFlag, removeFlag, getFlags } from '../sites-common';

const NAMESPACE = 'immobilienscout24.de';

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

const nodeListToArray = (list: NodeList) => {
  return [].slice.call(list);
};

const getTitle = (item) => {
  const div = document.createElement('div');

  div.innerHTML = item.querySelector('h5').innerHTML;

  const spans = nodeListToArray(div.querySelectorAll('span'));

  for (const span of spans) {
    span.remove();
  }

  return removeUnnecessaryWhitespace(textContentWithSeparator(div));
};

const getPrice = (item) => {
  const attributes = nodeListToArray(item.querySelectorAll('.result-list-entry__criteria dl'));

  for (const attribute of attributes) {
    const term = attribute.querySelector('dt');

    if (term && (term.innerText === 'Kaufpreis' || term.innerText === 'Preis')) {
      return attribute.querySelector('dd').innerText;
    }
  }

  return null;
};

const getImage = (item) => {
  let image = item.querySelector('.slick-current .gallery__image');

  if (!image) {
    image = item.querySelector('.gallery__image');
  }

  if (!image) {
    return null;
  }

  let src = image.src || image.getAttribute('data-lazy-src') || image.getAttribute('data-lazy');

  if (!src) {
    return null;
  }

  src = src.replace(/\/ORIG.*/, '');

  if (src.indexOf('http') !== src.lastIndexOf('http')) {
    src = src.substr(src.lastIndexOf('http'));
  }

  return src;
};

const getDescription = (item) => {
  const div = document.createElement('div');

  div.innerHTML = item.querySelector('.result-list-entry__criteria').innerHTML;

  const attributes = nodeListToArray(div.querySelectorAll('dl'));

  for (const attribute of attributes) {
    const term = attribute.querySelector('dt');

    if (term && (term.innerText === 'Kaufpreis' || term.innerText === 'Preis')) {
      attribute.remove();
    }
  }

  return removeUnnecessaryWhitespace(textContentWithSeparator(div));
};

const getItemData = (item) => {
  return {
    [BASE_PROPERTIES.ID]: item.getAttribute('data-id'),
    [PROPERTIES.TITLE]: getTitle(item),
    [PROPERTIES.PRICE]: getPrice(item),
    [PROPERTIES.URL]: item.querySelector('h5').closest('a').href,
    [PROPERTIES.PICTURE]: getImage(item),
    [PROPERTIES.DESCRIPTION]: getDescription(item)
  };
};

const stringToPrice = (price) => {
  const value = parseFloat(price.replace(/(?!-)[^0-9]/g, ''));

  return {
    value: isNaN(value) ? null : value,
    currency: isNaN(value) ? null : removeUnnecessaryWhitespace(price.replace(/[0-9.-]/g, ''))
  };
};

const openComments = (item) => {
  const state = getItemCurrentState(item);

  return callService(SERVICES.OPEN_COMMENTS, {
    namespace: NAMESPACE,
    language: getLanguage(),
    id: state[BASE_PROPERTIES.ID],
    title: state[PROPERTIES.TITLE],
    description: state[PROPERTIES.DESCRIPTION],
    picture: state[PROPERTIES.PICTURE]
  });
};

const start = async () => {
  const items = [].slice.call(document.querySelectorAll('.result-list__listing[data-id]'));

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
    div.style.zIndex = '4';

    items[i].firstElementChild.appendChild(div);

    getToolbar().initToolbar(
      shadow,
      response.items[i],
      response.currentDatetime,
      propertiesToCheck,
      stringToPrice,
      openComments,
      setColor(NAMESPACE),
      addFlag(NAMESPACE),
      removeFlag(NAMESPACE),
      getFlags(NAMESPACE)
    );
  }
};

if (window.location.pathname.indexOf('/Suche/') === 0) {
  addCustomFont(document);

  const observer = new MutationObserver(function(mutations) {
    for(const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.removedNodes.length) {
        const first = mutation.removedNodes[0] as HTMLElement;

        const isWaitingElement = first.querySelector('.result-list-entry__waiting') !== null;

        if (isWaitingElement) {
          start();
        }
      }
    }
  });

  observer.observe(document.querySelector('#resultListItems'), { childList: true });

  start();
}
