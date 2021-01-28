import { BASE_PROPERTIES, SERVICES, PROPERTY_TYPES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getLanguage, getTranslations } from '../translations';
import { getToolbar } from '../dic';
import { callService, addCustomFont, getItemCurrentState, setColor, addFlag, removeFlag, getFlags } from '../sites-common';

const NAMESPACE = 'mobile.de';

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

const getId = (link) => {
  const params = new URLSearchParams(link.search);

  return params.get('id');
};

const getUrl = (href) => {
  const a = document.createElement('a');

  a.href = href;

  const originalParams = new URLSearchParams(a.search);
  const params = new URLSearchParams();

  params.set('id', originalParams.get('id'));
  params.set('damageUnrepaired', originalParams.get('damageUnrepaired'));

  a.search = params.toString();

  return a.href;
};

const getImage = (image) => {
  if (!image) {
    return null;
  }

  const { src } = image;

  if (!src) {
    return null;
  }

  return src.replace(/\$\_\d+\.jpg/, '$_90.jpg');
};

const getDescription = (item) => {
  return removeUnnecessaryWhitespace(textContentWithSeparator(item.querySelector('.rbt-regMilPow').parentElement));
};

const getItemData = (item) => {
  const link = item.querySelector('a');

  return {
    [BASE_PROPERTIES.ID]: getId(link),
    [PROPERTIES.TITLE]: item.querySelector('.headline-block .h3').textContent,
    [PROPERTIES.PRICE]: item.querySelector('.price-block .h3').textContent,
    [PROPERTIES.URL]: getUrl(link.href),
    [PROPERTIES.PICTURE]: getImage(item.querySelector('.image-block img')),
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
  if (
    window.location.pathname.indexOf('/fahrzeuge/search.html') === 0 &&
    window.location.search.indexOf('isSearchRequest=true') !== -1
  ) {
    addCustomFont(document);

    const items = [].slice.call(document.querySelectorAll('.cBox-body--resultitem, .cBox-body--topResultitem'));

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
      div.style.zIndex = '1000';

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
