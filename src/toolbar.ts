import { diffHTML } from './Diffr';
import { BASE_PROPERTIES, PROPERTY_TYPES } from './constants';
import { setToolbar } from './dic';
import { getTranslations } from './translations';
import { toolbarCss } from './toolbar.css';

const { html, render, useState, useRef } = window['htmPreact'];

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

const renderDiffText = (oldValue, value) => {
  return html`<span dangerouslySetInnerHTML="${{ __html : getTextDiff(oldValue, value) }}"></span>`;
};

const renderDiffLinkValue = (value, isOld, placeholder) => {
  return value
    ? html`<a href="${value}" target="_blank" style="color: ${isOld ? '#ff4500' : '#39b54a'};">${placeholder}</a>`
    : html`<span style="text-decoration: line-through;">${placeholder}</span>`;
};

const renderDiffLink = (oldValue, oldPlaceholder, value, placeholder) => {
  return html`${renderDiffLinkValue(oldValue, true, oldPlaceholder)} - ${renderDiffLinkValue(value, false, placeholder)}`;
};

const renderDiff = (oldValue, value, type) => {
  if (type === PROPERTY_TYPES.TEXT) {
    return renderDiffText(oldValue, value);
  } else if (type === PROPERTY_TYPES.URL) {
    return renderDiffLink(oldValue, translations.oldUrl, value, translations.newUrl);
  } else if (type === PROPERTY_TYPES.IMAGE) {
    return renderDiffLink(oldValue, translations.oldImage, value, translations.newImage);
  }

  return html`<span style="color: #ff4500; text-decoration: line-through;">${oldValue}</span> <span style="color: #39b54a;">${value}</span>`;
};

const getElementParameters = (history, currentDatetime, propertiesToCheck, stringToPrice) => {
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
    changes
  };
};

const Toolbar = (props) => {
  const {
    item,
    currentDatetime,
    propertiesToCheck,
    stringToPrice,
    setColor,
    setNote
  } = props;
  const parameters = getElementParameters(item.history, currentDatetime, propertiesToCheck, stringToPrice);

  const [isChangesClosed, setIsChangesClosed] = useState(true);
  const documentChangesClickHandlerRef = useRef(null);

  const [isNoteClosed, setIsNoteClosed] = useState(true);
  const documentNoteClickHandlerRef = useRef(null);
  const noteTextareaRef = useRef(null);
  const [savedNote, setSavedNote] = useState(item.note);

  const getContainerBackground = (color) => {
    const theme = color && colors[color] ? colors[color] : colors.default;

    return theme.containerBackground;
  };

  const [isColorsClosed, setIsColorsClosed] = useState(true);
  const [selectedColor, setSelectedColor] = useState(getContainerBackground(item.color));

  const closeChanges = () => {
    document.removeEventListener('mousedown', documentChangesClickHandlerRef.current);

    documentChangesClickHandlerRef.current = null;

    setIsChangesClosed(true);
  };

  const openChanges = (e) => {
    if (!e.currentTarget.classList.contains('active')) {
      return;
    }

    documentChangesClickHandlerRef.current = closeChanges;

    document.addEventListener('mousedown', documentChangesClickHandlerRef.current);

    setIsChangesClosed(false);
  };

  const closeNote = () => {
    document.removeEventListener('mousedown', documentNoteClickHandlerRef.current);

    documentNoteClickHandlerRef.current = null;

    setIsNoteClosed(true);
  };

  const openNote = () => {
    documentNoteClickHandlerRef.current = closeNote;

    document.addEventListener('mousedown', documentNoteClickHandlerRef.current);

    noteTextareaRef.current.value = item.note === undefined ? '' : item.note;

    setIsNoteClosed(false);
  };

  const noteSubmitHandler = (e) => {
    e.preventDefault();

    const note = noteTextareaRef.current.value === '' ? null : noteTextareaRef.current.value;

    setNote(item, note);

    if (note === null) {
      delete item.note;
    } else {
      item.note = note;
    }

    setSavedNote(item.note);

    closeNote();
  };

  const openColors = () => {
    setIsColorsClosed(false);
  };

  const closeColors = () => {
    setIsColorsClosed(true);
  };

  const selectColor = (e) => {
    const colorAttribute = e.currentTarget.getAttribute('data-color-key');
    const color = colorAttribute === 'default' ? null : colorAttribute;

    setColor(item, color);

    if (color === null) {
      delete item.color;
    } else {
      item.color = color;
    }

    setIsColorsClosed(true);
    setSelectedColor(getContainerBackground(item.color));
  };

  const {
    creationDate,
    days,
    priceDifference,
    currency,
    changes
  } = parameters;

  return html`
<div style="--meerkat-container-background: ${selectedColor};">
  <style>${toolbarCss}</style>
  <div class="container">
    <span class="logo">M</span>
    <span class="date" title="${translations.firstSaw}: ${timestampToString(creationDate)}">${days} ${translations.daysAgo}</span>
    <span
      class="price-difference ${priceDifference === 0 || priceDifference === null ? '' : `has-difference ${priceDifference < 0 ? 'good-difference' : ''}`}"
      title="${translations.priceChange}"
    >${priceDifference > 0 ? '+' : ''}${numberToString(priceDifference)}${currency === null ? '' : ` ${currency}`}</span>
    <a class="changes-button ${changes.length > 0 ? 'active' : ''}" href="javascript:void(0);" onClick=${openChanges}>${translations.changes} (${changes.length})</a>
    <div class="changes ${isChangesClosed ? '' : 'open'}">
      <div class="changes-container">
        <div class="changes-container-inner">
          <table>
            <thead>
              <th class="changes-type">${translations.changesLabelType}</th>
              <th class="changes-date">${translations.changesLabelDate}</th>
              <th>${translations.changesLabelValue}</th>
            </thead>
            <tbody>
              ${changes.map(change => html`
                <tr>
                  <td>${change.property.title}</td>
                  <td>${timestampToString(change.date)}</td>
                  <td>${renderDiff(change.oldValue, change.value, change.property.type)}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <a href="javascript:void(0);" class="logo changes-close-button" onClick=${closeChanges}>X</a>
      </div>
    </div>
    <a class="note-button ${savedNote === undefined ? '' : 'active'}" href="javascript:void(0);" onClick=${openNote}>
      ${translations.note}
      ${savedNote !== undefined && html` (<span>${savedNote}</span>)`}
    </a>
    <div class="note ${isNoteClosed ? '' : 'open'}">
      <div class="note-header">${translations.note}</div>
      <div class="note-container">
        <div class="note-container-inner">
          <textarea ref=${noteTextareaRef} placeholder="${translations.notePlaceholder}"></textarea>
        </div>
      </div>
      <div>
        <a href="javascript:void(0);" class="logo note-close-button" onClick=${closeNote}>X</a>
        <form class="note-form" onSubmit=${noteSubmitHandler}>
          <button>${translations.noteSave}</button>
        </form>
      </div>
    </div>
    <div class="colors-button ${isColorsClosed ? '' : 'open'}" onMouseEnter=${openColors} onMouseLeave=${closeColors}>
      <div class="colors-button-icon">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <div class="colors-container">
        ${Object.keys(colors).map(colorKey => html`
          <a
            href="javascript:void(0);"
            class="colors-color-button"
            style="background-color: ${colors[colorKey].containerBackground}"
            title="${colorKey}"
            data-color-key="${colorKey}"
            onClick=${selectColor}
          ></a>
        `)}
      </div>
    </div>
  </div>
</div>
`;
};

const initToolbar = (
  root,
  item,
  currentDatetime,
  propertiesToCheck,
  stringToPrice,
  setColor,
  setNote
) => {
  root.addEventListener( 'mousedown', (e) => {
    e.stopPropagation();
  });

  root.addEventListener( 'keydown', (e) => {
    e.stopPropagation();
  });

  const props = {
    item,
    currentDatetime,
    propertiesToCheck,
    stringToPrice,
    setColor,
    setNote
  };

  render(html`<${Toolbar} ...${props} />`, root);
};

setToolbar({
  initToolbar
});
