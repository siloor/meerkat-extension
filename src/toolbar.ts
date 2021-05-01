import { diffHTML } from './Diffr';
import { BASE_PROPERTIES, PROPERTY_TYPES } from './constants';
import { setToolbar } from './dic';
import { getTranslations } from './translations';
import { toolbarCss } from './toolbar.css';

const { html, render, useEffect } = window['htmPreact'];

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

const Toolbar = (props) => {
  const {
    root,
    item,
    currentDatetime,
    propertiesToCheck,
    stringToPrice,
    setColor,
    setNote
  } = props;
  const parameters = getElementParameters(item.history, currentDatetime, propertiesToCheck, stringToPrice);

  useEffect(() => {
    startToolbar(
      root,
      item,
      currentDatetime,
      propertiesToCheck,
      stringToPrice,
      setColor,
      setNote,
      parameters
    );

    return () => {
      // Optional: Any cleanup code
    };
  }, []);

  const {
    creationDate,
    days,
    priceDifference,
    currency,
    changes
  } = parameters;

  return html`
<div>
  <style>${toolbarCss}</style>
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
        <a href="javascript:void(0);" class="logo changes-close-button">X</a>
      </div>
    </div>
    <a class="note-button" href="javascript:void(0);">${translations.note}<span></span></a>
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
        ${Object.keys(colors).map(colorKey => html`
          <a href="javascript:void(0);" class="colors-color-button" style="background-color: ${colors[colorKey].containerBackground}" title="${colorKey}" data-color-key="${colorKey}"></a>
        `)}
      </div>
    </div>
  </div>
</div>
`;
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

const setColorState = (element, color) => {
  const theme = color && colors[color] ? colors[color] : colors.default;

  element.style.setProperty('--meerkat-container-background', theme.containerBackground);
};

const setNoteState = (noteOpenButton, noteOpenButtonSpan, note) => {
  const isEmpty = note === undefined;

  noteOpenButton.classList.toggle('active', !isEmpty);

  noteOpenButtonSpan.style.display = isEmpty ? 'none' : 'inline-block';
  noteOpenButtonSpan.innerHTML = isEmpty ? '' : `&nbsp;(<span>${note}</span>)`;
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
  const props = {
    root,
    item,
    currentDatetime,
    propertiesToCheck,
    stringToPrice,
    setColor,
    setNote
  };

  render(html`<${Toolbar} ...${props} />`, root);
};

const startToolbar = (
  root,
  item,
  currentDatetime,
  propertiesToCheck,
  stringToPrice,
  setColor,
  setNote,
  parameters
) => {
  const element = root.firstElementChild;
  const changesOpenButton = element.querySelector('.changes-button');
  const changesCloseButton = element.querySelector('.changes-close-button');
  const changes = element.querySelector('.changes');
  const colorsButton = element.querySelector('.colors-button');
  const colorsColorButtons = element.querySelectorAll('.colors-color-button');
  const noteOpenButton = element.querySelector('.note-button');
  const noteOpenButtonSpan = element.querySelector('.note-button span');
  const noteCloseButton = element.querySelector('.note-close-button');
  const note = element.querySelector('.note');
  const noteForm = element.querySelector('.note-form');
  const noteTextarea = element.querySelector('.note textarea');

  setColorState(element, item.color);
  setNoteState(noteOpenButton, noteOpenButtonSpan, item.note);

  let isChangesClosed = true;
  let isNoteClosed = true;

  const documentChangesClickHandler = (e) => {
    toggleChanges();
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

    setColorState(element, item.color);
  };

  changesOpenButton.addEventListener('click', toggleChanges);
  changesCloseButton.addEventListener('click', toggleChanges);

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

  noteForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const note = noteTextarea.value === '' ? null : noteTextarea.value;

    setNote(item, note);

    if (note === null) {
      delete item.note;
    } else {
      item.note = note;
    }

    setNoteState(noteOpenButton, noteOpenButtonSpan, item.note);

    toggleNote();
  });
};

setToolbar({
  initToolbar
});
