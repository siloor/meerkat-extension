import { BASE_PROPERTIES, SERVICES, PROPERTY_TYPES } from '../constants';
import { textContentWithSeparator, removeUnnecessaryWhitespace } from '../utils';
import { getTranslations } from '../translations';
import { getToolbar } from '../dic';
import { callService, addCustomFont, setColor, setNote } from '../sites-common';

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

const start = async () => {
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
      setColor(NAMESPACE),
      setNote(NAMESPACE)
    );
  }
};

if (window.location.pathname.indexOf('/talalatilista') === 0) {
  addCustomFont(document);

  start();
}
