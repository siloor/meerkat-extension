import { BASE_PROPERTIES, SERVICES, PROPERTY_TYPES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getLanguage, getTranslations } from '../translations';
import { getToolbar } from '../dic';
import { callService, addCustomFont, getItemCurrentState, setColor, addFlag, removeFlag, getFlags } from '../sites-common';

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

const openComments = (item) => {
  const state = getItemCurrentState(item);

  return callService(SERVICES.OPEN_COMMENTS, {
    namespace: NAMESPACE,
    language: getLanguage(),
    id: state[BASE_PROPERTIES.ID],
    title: '',
    description: state[PROPERTIES.DESCRIPTION],
    picture: state[PROPERTIES.PICTURE]
  });
};

const start = async () => {
  if (window.location.pathname.indexOf('/lista') === 0 || window.location.pathname.indexOf('/szukites') === 0) {
    addCustomFont(document);

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
        setColor(NAMESPACE),
        addFlag(NAMESPACE),
        removeFlag(NAMESPACE),
        getFlags(NAMESPACE)
      );
    }
  }
};

start();
