import { diffHTML } from './Diffr';
import { BASE_PROPERTIES, PROPERTY_TYPES } from './constants';
import { setToolbar } from './dic';
import { getTranslations } from './translations';

const colors = {
  default: {
    containerBackground: '#eee'
  },
  red: {
    containerBackground: '#f28b82'
  },
  orange: {
    containerBackground: '#fabe43'
  },
  yellow: {
    containerBackground: '#feeb75'
  },
  green: {
    containerBackground: '#c9eb8f'
  },
  teal: {
    containerBackground: '#a5f8ea'
  },
  blue: {
    containerBackground: '#cbf0f8'
  },
  darkBlue: {
    containerBackground: '#aecbfa'
  },
  purple: {
    containerBackground: '#d7aefb'
  },
  pink: {
    containerBackground: '#fbcfe8'
  },
  brown: {
    containerBackground: '#e6c9a8'
  },
  gray: {
    containerBackground: '#e8eaed'
  }
};

const timestampToString = (timestamp) => {
  const date = new Date(timestamp);

  return (new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000))).toISOString().split('T')[0].replace(/-/g, '.') + '.';
};

const numberToString = (number) => {
  if (number === null) {
    return '-';
  }

  const parts = number.toString().split('.');

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return parts.join('.');
};

const getTextDiff = (oldValue, value) => {
  return diffHTML(oldValue, value)
    .replace(/<ins/g, '<ins style="text-decoration: none; color: #39b54a;"')
    .replace(/<del/g, '<del style="color: #ff4500;"');
};

const renderElement = ({
  creationDate,
  days,
  priceDifference,
  currency,
  commentCount,
  color,
  changes
}) => {
  const theme = color && colors[color] ? colors[color] : colors.default;

  const translations = getTranslations({
    en: {
      firstSaw: 'First saw',
      daysAgo: 'days ago',
      priceChange: 'Price change',
      changes: 'Changes',
      changesLabelType: 'Type',
      changesLabelDate: 'Date',
      changesLabelValue: 'Value',
      comments: 'Comments',
      oldUrl: 'Old link',
      newUrl: 'New link',
      oldImage: 'Old image',
      newImage: 'New image'
    },
    hu: {
      firstSaw: 'Első megtekintés',
      daysAgo: 'napja',
      priceChange: 'Árváltozás',
      changes: 'Változások',
      changesLabelType: 'Típus',
      changesLabelDate: 'Dátum',
      changesLabelValue: 'Érték',
      comments: 'Hozzászólások',
      oldUrl: 'Régi link',
      newUrl: 'Új link',
      oldImage: 'Régi kép',
      newImage: 'Új kép'
    }
  });

  const renderDiff = (oldValue, value, type) => {
    if (type === PROPERTY_TYPES.TEXT) {
      return getTextDiff(oldValue, value);
    } else if (type === PROPERTY_TYPES.URL) {
      return [
        oldValue
          ? `<a href="${oldValue || ''}" target="_blank" style="color: #ff4500;">${translations.oldUrl}</a>`
          : `<span style="text-decoration: line-through;">${translations.oldUrl}</span>`,
        value
          ? `<a href="${value || ''}" target="_blank" style="color: #39b54a;">${translations.newUrl}</a>`
          : `<span style="text-decoration: line-through;">${translations.newUrl}</span>`
      ].join(' - ');
    } else if (type === PROPERTY_TYPES.IMAGE) {
      return [
        oldValue
          ? `<a href="${oldValue || ''}" target="_blank" style="color: #ff4500;">${translations.oldImage}</a>`
          : `<span style="text-decoration: line-through;">${translations.oldImage}</span>`,
        value
          ? `<a href="${value || ''}" target="_blank" style="color: #39b54a;">${translations.newImage}</a>`
          : `<span style="text-decoration: line-through;">${translations.newImage}</span>`
      ].join(' - ');
    }

    return `<span style="color: #ff4500; text-decoration: line-through;">${oldValue}</span> <span style="color: #39b54a;">${value}</span>`;
  };

  const changesHTML = [];

  for (const change of changes) {
    changesHTML.push(`
      <tr>
        <td>${change.property.title}</td>
        <td>${timestampToString(change.date)}</td>
        <td>${renderDiff(change.oldValue, change.value, change.property.type)}</td>
      </tr>
    `);
  }

  const colorsHTML = [];

  for (const colorKey of Object.keys(colors)) {
    colorsHTML.push(`
      <a href="javascript:void(0);" class="colors-color-button" style="background-color: ${colors[colorKey].containerBackground}" title="${colorKey}" data-color-key="${colorKey}"></a>
    `);
  }

  return `
<div>
  <style>
    a {
      text-decoration: none;
    }

    .container {
      position: relative;
      float: left;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.23);
      font-family: 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 12px;
    }

    .logo {
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      border-radius: 10px;
      text-align: center;
      font-size: 14px;
      font-weight: bold;
      background-color: rgba(0, 0, 0, 0.15);
      color: #fff;
    }

    .changes-close-button {
      margin: 8px;
    }

    .date {
      margin-left: 20px;
      color: rgba(0, 0, 0, 0.4);
    }

    .price-difference {
      margin-left: 20px;
    }

    .changes-button {
      margin-left: 20px;
    }

    .changes {
      position: absolute;
      z-index: 1;
      bottom: 0;
      left: 0;
      background: #eee;
      width: 0;
      height: 0;
      opacity: 0;
      border-radius: 16px;
      overflow: hidden;
      transition: width 0.2s, height 0.2s, opacity 0.2s;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.23);
      display: flex;
      flex-direction: column;
    }

    .table-container {
      padding: 10px 10px 0 10px;
      overflow: auto;
      flex-grow: 1;
    }

    .table-container-inner {
      width: 100%;
      height: 100%;
      overflow: auto;
    }

    .table {
      table-layout: fixed;
      width: 100%;
      border-spacing: 0;
    }

    .table th {
      padding: 8px;
      position: sticky;
      top: 0;
      background: #eee;
      box-shadow: inset 0 -1px 0 #bbb;
      font-size: 14px;
      color: #999;
    }

    .table td {
      padding: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .comments-button {
      margin-left: 20px;
      margin-right: 10px;
    }

    .colors-button {
      margin-right: 6px;
      float: right;
      width: 20px;
      height: 20px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
      border-radius: 10px;
      position: relative;
    }

    .colors-container {
      display: none;
      position: absolute;
      bottom: 20px;
      left: 0;
      width: 168px;
      height: 60px;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 10px;
    }

    .colors-color-button {
      display: inline-block;
      width: 20px;
      height: 20px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
      border-radius: 10px;
      margin: 4px;
    }
  </style>
  <div class="container" style="background-color: ${theme.containerBackground}">
    <span class="logo">M</span>
    <span class="date" title="${translations.firstSaw}: ${timestampToString(creationDate)}">${days} ${translations.daysAgo}</span>
    <span class="price-difference" style="font-weight: ${priceDifference === 0 || priceDifference === null ? 'normal' : 'bold'}; color: ${priceDifference === 0 || priceDifference === null ? 'rgba(0, 0, 0, 0.4)' : (priceDifference > 0 ? '#ff4500' : '#39b54a')};" title="${translations.priceChange}">${priceDifference > 0 ? '+' : ''}${numberToString(priceDifference)}${currency === null ? '' : ` ${currency}`}</span>
    <a class="changes-button" style="color: ${changes.length > 0 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)'};" href="javascript:void(0);">${translations.changes} (${changes.length})</a>
    <div class="changes">
      <div class="table-container">
        <div class="table-container-inner">
          <table class="table">
            <thead>
              <th style="width: 70px;">${translations.changesLabelType}</th>
              <th style="width: 90px;">${translations.changesLabelDate}</th>
              <th>${translations.changesLabelValue}</th>
            </thead>
            <tbody>
              ${changesHTML.map(html => html.trim()).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <a href="javascript:void(0);" class="logo changes-close-button">X</a>
      </div>
    </div>
    <a class="comments-button" style="color: ${commentCount > 0 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)'};" href="javascript:void(0);">${translations.comments} (${commentCount})</a>
    <div class="colors-button" href="javascript:void(0);">
      <div class="colors-container">
        ${colorsHTML.map(html => html.trim()).join('')}
      </div>
    </div>
  </div>
</div>
`;
};

const getElementParameters = (history, commentCount, color, propertiesToCheck, stringToPrice) => {
  const oldPrice = stringToPrice(history[0].price);
  const newPrice = stringToPrice(history[history.length - 1].price);

  const changes = [];

  for (let i = 1; i < history.length; i++) {
    for (const property of propertiesToCheck) {
      const value = history[i][property.name];
      const oldValue = history[i - 1][property.name];

      if (value === oldValue) {
        continue;
      }

      changes.push({
        property: property,
        date: history[i][BASE_PROPERTIES.CREATED_TIMESTAMP],
        value: value,
        oldValue: oldValue
      });
    }
  }

  return {
    creationDate: history[0][BASE_PROPERTIES.CREATED_TIMESTAMP],
    days: Math.round(((new Date()).getTime() - history[0][BASE_PROPERTIES.CREATED_TIMESTAMP]) / (1000 * 60 * 60 * 24)),
    priceDifference: oldPrice.value === null && newPrice.value === null ? null : newPrice.value - oldPrice.value,
    currency: oldPrice.currency === null ? newPrice.currency : oldPrice.currency,
    commentCount: commentCount,
    color: color,
    changes
  };
};

const initToolbar = (root, item, propertiesToCheck, stringToPrice, openComments, setColor) => {
  const parameters = getElementParameters(item.history, item.commentCount, item.color, propertiesToCheck, stringToPrice);

  root.innerHTML = renderElement(parameters).trim();

  const element = root.firstElementChild;
  const openButton = element.querySelector('.changes-button');
  const closeButton = element.querySelector('.changes-close-button');
  const commentsButton = element.querySelector('.comments-button');
  const colorsButton = element.querySelector('.colors-button');
  const colorsColorButtons = element.querySelectorAll('.colors-color-button');
  const historyElement = openButton.nextElementSibling as HTMLElement;

  let isClosed = true;

  const documentClickHandler = (e) => {
    toggleElement();
  };

  const toggleElement = () => {
    if (parameters.changes.length === 0) {
      return;
    }

    isClosed = !isClosed;

    historyElement.style.height = isClosed ? '0px' : '200px';
    historyElement.style.width = isClosed ? '0px' : '500px';
    historyElement.style.opacity = isClosed ? '0' : '1';

    if (isClosed) {
      document.removeEventListener('mousedown', documentClickHandler);
    } else {
      document.addEventListener('mousedown', documentClickHandler);
    }
  };

  const colorsLeaveHandler = () => {
    const colorsContainer = colorsButton.firstElementChild;

    colorsButton.removeEventListener('mouseleave', colorsLeaveHandler);

    colorsContainer.style.display = 'none';
  };

  const colorsHandler = (e) => {
    const colorsContainer = colorsButton.firstElementChild;

    colorsButton.addEventListener('mouseleave', colorsLeaveHandler);

    colorsContainer.style.display = 'block';
  };

  const colorsColorClickHandler = (e) => {
    colorsLeaveHandler();

    const color = e.target.getAttribute('data-color-key');

    setColor(item, color === 'default' ? null : color);

    root.innerHTML = '';

    if (color === 'default') {
      delete item.color;
    } else {
      item.color = color;
    }

    initToolbar(root, item, propertiesToCheck, stringToPrice, openComments, setColor);
  };

  openButton.addEventListener('click', toggleElement);
  closeButton.addEventListener('click', toggleElement);

  colorsButton.addEventListener('mouseenter', colorsHandler);

  for (const colorsColorButton of colorsColorButtons) {
    colorsColorButton.addEventListener('click', colorsColorClickHandler);
  }

  commentsButton.addEventListener('click', () => {
    openComments(item);
  });

  root.addEventListener( 'mousedown', (e) => {
    e.stopPropagation();
  });
};

setToolbar({
  initToolbar
});
