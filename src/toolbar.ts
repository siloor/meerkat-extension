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
  white: {
    containerBackground: '#fff'
  }
};

const translations = getTranslations({
  en: {
    firstSaw: 'First saw',
    daysAgo: 'days ago',
    priceChange: 'Price change',
    changes: 'Changes',
    changesLabelType: 'Type',
    changesLabelDate: 'Date',
    changesLabelValue: 'Value',
    oldUrl: 'Old link',
    newUrl: 'New link',
    oldImage: 'Old image',
    newImage: 'New image',
    flags: 'Tags',
    flagAdd: 'Add',
    flagAddStart: 'Add tag',
    flagsEmptyText: 'There are no added tags yet. Be the first and add one!',
    note: 'Note',
    noteSave: 'Save',
    notePlaceholder: 'Take a note...'
  },
  hu: {
    firstSaw: 'Első megtekintés',
    daysAgo: 'napja',
    priceChange: 'Árváltozás',
    changes: 'Változások',
    changesLabelType: 'Típus',
    changesLabelDate: 'Dátum',
    changesLabelValue: 'Érték',
    oldUrl: 'Régi link',
    newUrl: 'Új link',
    oldImage: 'Régi kép',
    newImage: 'Új kép',
    flags: 'Címkék',
    flagAdd: 'Hozzáadás',
    flagAddStart: 'Címke hozzáadása',
    flagsEmptyText: 'Nincs még hozzáadott címke. Legyél te az első és adj hozzá egyet!',
    note: 'Jegyzet',
    noteSave: 'Mentés',
    notePlaceholder: 'Ide jegyzetelj...'
  }
});

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
  flags,
  changes
}) => {
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
      font-family: 'Roboto', 'Open Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 17px;
      background-color: var(--meerkat-container-background);
    }

    .logo {
      display: inline-block;
      width: 20px;
      height: 20px;
      line-height: 20px;
      border-radius: 10px;
      text-align: center;
      font-size: 13px;
      font-weight: bold;
      background-color: rgba(0, 0, 0, 0.15);
      color: #fff;
    }

    .date {
      margin-left: 16px;
      color: rgba(0, 0, 0, 0.4);
    }

    .price-difference {
      margin-left: 16px;
    }

    .changes-button {
      margin-left: 16px;
    }

    .changes-close-button {
      margin: 8px;
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

    .changes-container {
      padding: 10px 10px 0 10px;
      overflow: auto;
      flex-grow: 1;
    }

    .changes-container-inner {
      width: 100%;
      height: 100%;
      overflow: auto;
    }

    .changes table {
      table-layout: fixed;
      width: 100%;
      border-spacing: 0;
    }

    .changes table th {
      padding: 8px;
      position: sticky;
      top: 0;
      background: #eee;
      box-shadow: inset 0 -1px 0 #bbb;
      font-size: 14px;
      color: #999;
    }

    .changes table td {
      padding: 8px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .flags-button {
      margin-left: 16px;
    }

    .flags-button span {
      background-color: #fff;
      padding: 2px 5px;
      border-radius: 10px;
      margin-left: 3px;
    }

    .flags-close-button {
      margin: 8px;
    }

    .flags {
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

    .flags-header {
      padding: 10px;
      font-size: 14px;
    }

    .flags-container {
      padding: 10px 10px 0 10px;
      overflow: auto;
      flex-grow: 1;
    }

    .flags-container-inner {
      width: 100%;
      height: 100%;
      overflow: auto;
    }

    .flags-empty-text {
      margin: 0;
    }

    .flags ul {
      list-style-type: none;
      margin: 0;
      padding: 0;
    }

    .flags ul li {
      position: relative;
      display: block;
      float: left;
      background-color: rgba(255, 255, 255, 0.75);
      padding: 6px 10px;
      margin: 3px;
      border-radius: 10px;
      cursor: pointer;
    }

    .flags ul li span {
      display: none;
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: 30px;
      height: 29px;
      line-height: 29px;
      text-align: center;
      border-top-right-radius: 10px;
      border-bottom-right-radius: 10px;
      font-size: 21px;
      background-color: #555;
      color: #fff;
    }

    .flags ul li span:before {
      content: "+";
    }

    .flags ul li:hover span {
      display: block;
    }

    .flags ul li.flagged {
      background-color: rgba(0, 0, 0, 0.5);
      color: #fff;
    }

    .flags ul li.flagged span:before {
      content: "-";
    }

    .flags-add-form {
      float: right;
    }

    .flags-add-form input {
      display: block;
      float: left;
      margin: 5px;
      width: 200px;
      padding: 4px;
      height: 16px;
      border: 1px solid #999;
      border-radius: 4px;
    }

    .flags-add-form input:focus {
      outline: 0;
      border: 2px solid #000;
      padding: 3px;
    }

    .flags-add-form button {
      margin: 5px 20px 5px 0;
      box-sizing: content-box;
      padding: 4px 14px;
      height: 16px;
      border: 1px solid #999;
      border-radius: 4px;
      font-size: 13px;
    }

    .flags-add-form button:focus {
      outline: 0;
      border: 2px solid #000;
      padding: 3px 13px;
    }

    .note-button {
      margin-left: 16px;
    }

    .note-button span {
      background-color: #fff;
      padding: 2px 5px;
      border-radius: 10px;
      margin-left: 8px;
      display: inline-block;
      vertical-align: bottom;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 40px;
    }

    .note-close-button {
      margin: 8px;
    }

    .note {
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

    .note-container {
      padding: 0 10px 0 10px;
      overflow: auto;
      flex-grow: 1;
    }

    .note-container-inner {
      width: 100%;
      height: 100%;
      overflow: auto;
    }

    .note-container-inner textarea {
      display: block;
      resize: none;
      outline: none;
      box-sizing: border-box;
      margin: 0;
      border: 0;
      width: 100%;
      height: 100%;
      font-family: inherit;
      font-size: 13px;
      padding: 10px;
      border-radius: 4px;
      transition: background-color 0.5s ease;
      background-color: rgba(0, 0, 0, 0.1);
    }

    .note-container-inner textarea:focus {
      background-color: rgba(255, 255, 255, 0.6);
    }

    .note-header {
      padding: 10px;
      font-size: 14px;
    }

    .note-form {
      float: right;
    }

    .note-form button {
      margin: 5px 20px 5px 0;
      box-sizing: content-box;
      padding: 4px 14px;
      height: 16px;
      border: 1px solid #999;
      border-radius: 4px;
      font-size: 13px;
    }

    .note-form button:focus {
      outline: 0;
      border: 2px solid #000;
      padding: 3px 13px;
    }

    .colors-button {
      margin-left: 16px;
      margin-right: 6px;
      float: right;
      position: relative;
      opacity: 0.5;
    }

    .colors-button.open {
      opacity: 1;
    }

    .colors-button-icon {
      width: 20px;
      height: 20px;
      box-shadow: 0 0 4px rgba(0, 0, 0, 0.4);
      border-radius: 10px;
    }

    .colors-button-icon span {
      display: block;
      float: left;
      width: 10px;
      height: 10px;
    }

    .colors-button-icon span:nth-child(1) {
      border-top-left-radius: 10px;
      background: #f86b43;
    }

    .colors-button-icon span:nth-child(2) {
      border-top-right-radius: 10px;
      background: #92c523;
    }

    .colors-button-icon span:nth-child(3) {
      border-bottom-left-radius: 10px;
      background: #01b6f1;
    }

    .colors-button-icon span:nth-child(4) {
      border-bottom-right-radius: 10px;
      background: #ffc644;
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

    .colors-button.open .colors-container {
      display: block;
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
  <div class="container">
    <span class="logo">M</span>
    <span class="date" title="${translations.firstSaw}: ${timestampToString(creationDate)}">${days} ${translations.daysAgo}</span>
    <span class="price-difference" style="font-weight: ${priceDifference === 0 || priceDifference === null ? 'normal' : 'bold'}; color: ${priceDifference === 0 || priceDifference === null ? 'rgba(0, 0, 0, 0.4)' : (priceDifference > 0 ? '#ff4500' : '#39b54a')};" title="${translations.priceChange}">${priceDifference > 0 ? '+' : ''}${numberToString(priceDifference)}${currency === null ? '' : ` ${currency}`}</span>
    <a class="changes-button" style="color: ${changes.length > 0 ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)'};" href="javascript:void(0);">${translations.changes} (${changes.length})</a>
    <div class="changes">
      <div class="changes-container">
        <div class="changes-container-inner">
          <table>
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
    <a class="flags-button" style="color: ${true ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)'};" href="javascript:void(0);">${translations.flags} (${flags.count})${flags.top ? ` <span>${flags.top.title}</span>` : ''}</a>
    <div class="flags">
      <div class="flags-header">${translations.flags}</div>
      <div class="flags-container">
        <div class="flags-container-inner">
          <ul></ul>
        </div>
      </div>
      <div>
        <a href="javascript:void(0);" class="logo flags-close-button">X</a>
        <form class="flags-add-form">
          <div class="flags-add-start">
            <button>${translations.flagAddStart}</button>
          </div>
          <div class="flags-add-inputs">
            <input type="text" name="title" />
            <button>${translations.flagAdd}</button>
          </div>
        </form>
      </div>
    </div>
    <a class="note-button" style="color: ${true ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)'};" href="javascript:void(0);">${translations.note}<span></span></a>
    <div class="note">
      <div class="note-header">${translations.note}</div>
      <div class="note-container">
        <div class="note-container-inner">
          <textarea placeholder="${translations.notePlaceholder}"></textarea>
        </div>
      </div>
      <div>
        <a href="javascript:void(0);" class="logo note-close-button">X</a>
        <form class="note-form">
          <button>${translations.noteSave}</button>
        </form>
      </div>
    </div>
    <div class="colors-button">
      <div class="colors-button-icon">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="colors-container">
        ${colorsHTML.map(html => html.trim()).join('')}
      </div>
    </div>
  </div>
</div>
`;
};

const showFlagInputs = (flagsAddStart, flagsAddInputs, show) => {
  flagsAddStart.style.display = show ? 'none' : 'block';
  flagsAddInputs.style.display = show ? 'block' : 'none';
};

const renderFlags = async (getFlags, addFlag, removeFlag, item, flagsContainer) => {
  const flags = await getFlags(item);

  if (flags.length) {
    flagsContainer.querySelector('.flags-container-inner').innerHTML = `<ul>${
      flags
        .map(flag => `<li class="${flag.flagged ? 'flagged' : ''}" data-title="${flag.title}">${flag.title} (${flag.count})<span></span></li>`)
        .join('')
    }</ul>`;
  } else {
    flagsContainer.querySelector('.flags-container-inner').innerHTML = `<p class="flags-empty-text">${translations.flagsEmptyText}</p>`;
  }

  const flagButtons = flagsContainer.querySelectorAll('li');

  for (const flagButton of flagButtons) {
    flagButton.addEventListener('click', async (e) => {
      const flagged = e.currentTarget.classList.contains('flagged');
      const title = e.currentTarget.getAttribute('data-title');

      if (flagged) {
        await removeFlag(item, title);
      } else {
        await addFlag(item, title);
      }

      await renderFlags(getFlags, addFlag, removeFlag, item, flagsContainer);
    });
  }
};

const getElementParameters = (history, flags, currentDatetime, propertiesToCheck, stringToPrice) => {
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
    days: Math.round(((new Date(currentDatetime)).getTime() - history[0][BASE_PROPERTIES.CREATED_TIMESTAMP]) / (1000 * 60 * 60 * 24)),
    priceDifference: oldPrice.value === null && newPrice.value === null ? null : newPrice.value - oldPrice.value,
    currency: oldPrice.currency === null ? newPrice.currency : oldPrice.currency,
    flags: flags,
    changes
  };
};

const setColorState = (root, color) => {
  const theme = color && colors[color] ? colors[color] : colors.default;

  root.firstElementChild.style.setProperty('--meerkat-container-background', theme.containerBackground);
};

const setNoteState = (root, note) => {
  const noteOpenButtonSpan = root.querySelector('.note-button span');
  const isEmpty = note === undefined;

  noteOpenButtonSpan.style.display = isEmpty ? 'none' : 'inline-block';
  noteOpenButtonSpan.innerHTML = isEmpty ? '' : note;
};

const initToolbar = (
  root,
  item,
  currentDatetime,
  propertiesToCheck,
  stringToPrice,
  setColor,
  setNote,
  addFlag,
  removeFlag,
  getFlags
) => {
  const parameters = getElementParameters(item.history, item.flags, currentDatetime, propertiesToCheck, stringToPrice);

  root.innerHTML = renderElement(parameters).trim();

  setColorState(root, item.color);
  setNoteState(root, item.note);

  const element = root.firstElementChild;
  const changesOpenButton = element.querySelector('.changes-button');
  const changesCloseButton = element.querySelector('.changes-close-button');
  const changes = element.querySelector('.changes');
  const flagsOpenButton = element.querySelector('.flags-button');
  const flagsCloseButton = element.querySelector('.flags-close-button');
  const flags = element.querySelector('.flags');
  const colorsButton = element.querySelector('.colors-button');
  const colorsColorButtons = element.querySelectorAll('.colors-color-button');
  const flagsAddForm = element.querySelector('.flags-add-form');
  const flagsAddStart = element.querySelector('.flags-add-start');
  const flagsAddInputs = element.querySelector('.flags-add-inputs');
  const flagsContainer = element.querySelector('.flags-container');
  const noteOpenButton = element.querySelector('.note-button');
  const noteCloseButton = element.querySelector('.note-close-button');
  const note = element.querySelector('.note');
  const noteForm = element.querySelector('.note-form');
  const noteTextarea = element.querySelector('.note textarea');

  let isChangesClosed = true;
  let isFlagsClosed = true;
  let isNoteClosed = true;

  const documentChangesClickHandler = (e) => {
    toggleChanges();
  };

  const documentFlagsClickHandler = (e) => {
    toggleFlags();
  };

  const documentNoteClickHandler = (e) => {
    toggleNote();
  };

  const toggleChanges = () => {
    if (parameters.changes.length === 0) {
      return;
    }

    isChangesClosed = !isChangesClosed;

    changes.style.height = isChangesClosed ? '0px' : '200px';
    changes.style.width = isChangesClosed ? '0px' : '500px';
    changes.style.opacity = isChangesClosed ? '0' : '1';

    if (isChangesClosed) {
      document.removeEventListener('mousedown', documentChangesClickHandler);
    } else {
      document.addEventListener('mousedown', documentChangesClickHandler);
    }
  };

  const toggleFlags = async () => {
    if (isFlagsClosed) {
      await renderFlags(getFlags, addFlag, removeFlag, item, flagsContainer);
    }

    isFlagsClosed = !isFlagsClosed;

    flags.style.height = isFlagsClosed ? '0px' : '200px';
    flags.style.width = isFlagsClosed ? '0px' : '500px';
    flags.style.opacity = isFlagsClosed ? '0' : '1';

    if (isFlagsClosed) {
      document.removeEventListener('mousedown', documentFlagsClickHandler);
    } else {
      showFlagInputs(flagsAddStart, flagsAddInputs, false);

      document.addEventListener('mousedown', documentFlagsClickHandler);
    }
  };

  const toggleNote = () => {
    isNoteClosed = !isNoteClosed;

    note.style.height = isNoteClosed ? '0px' : '200px';
    note.style.width = isNoteClosed ? '0px' : '500px';
    note.style.opacity = isNoteClosed ? '0' : '1';

    if (isNoteClosed) {
      document.removeEventListener('mousedown', documentNoteClickHandler);
    } else {
      noteTextarea.value = item.note === undefined ? '' : item.note;

      document.addEventListener('mousedown', documentNoteClickHandler);
    }
  };

  const colorsLeaveHandler = () => {
    colorsButton.removeEventListener('mouseleave', colorsLeaveHandler);

    colorsButton.classList.remove('open');
  };

  const colorsHandler = (e) => {
    colorsButton.addEventListener('mouseleave', colorsLeaveHandler);

    colorsButton.classList.add('open');
  };

  const colorsColorClickHandler = (e) => {
    colorsLeaveHandler();

    const colorAttribute = e.target.getAttribute('data-color-key');
    const color = colorAttribute === 'default' ? null : colorAttribute;

    setColor(item, color);

    if (color === null) {
      delete item.color;
    } else {
      item.color = color;
    }

    setColorState(root, item.color);
  };

  changesOpenButton.addEventListener('click', toggleChanges);
  changesCloseButton.addEventListener('click', toggleChanges);

  flagsOpenButton.addEventListener('click', toggleFlags);
  flagsCloseButton.addEventListener('click', toggleFlags);

  noteOpenButton.addEventListener('click', toggleNote);
  noteCloseButton.addEventListener('click', toggleNote);

  colorsButton.addEventListener('mouseenter', colorsHandler);

  for (const colorsColorButton of colorsColorButtons) {
    colorsColorButton.addEventListener('click', colorsColorClickHandler);
  }

  root.addEventListener( 'mousedown', (e) => {
    e.stopPropagation();
  });

  root.addEventListener( 'keydown', (e) => {
    e.stopPropagation();
  });

  flagsAddStart.addEventListener('click', (e) => {
    showFlagInputs(flagsAddStart, flagsAddInputs, true);
  });

  flagsAddForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const call = async () => {
      const data = new FormData(flagsAddForm);
      const title = data.get('title');

      if (!title) {
        return;
      }

      const nameInput = flagsAddForm.querySelector('input[name=title]');

      nameInput.value = '';

      nameInput.blur();

      showFlagInputs(flagsAddStart, flagsAddInputs, false);

      await addFlag(item, title);

      await renderFlags(getFlags, addFlag, removeFlag, item, flagsContainer);
    };

    call();
  });

  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const note = noteTextarea.value === '' ? null : noteTextarea.value;

    setNote(item, note);

    if (note === null) {
      delete item.note;
    } else {
      item.note = note;
    }

    setNoteState(root, item.note);

    toggleNote();
  });
};

setToolbar({
  initToolbar
});
