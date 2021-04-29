import { BASE_PROPERTIES, SERVICES } from './constants';

export const callService = (name, data) => {
  return new Promise((resolve, reject) => {
    const message = {
      message: name,
      ...data
    };

    chrome.runtime.sendMessage(message, (response) => {
      resolve(response);
    });
  });
};

export const addCustomFont = (document) => {
  const styleDiv = document.createElement('div');

  styleDiv.innerHTML = `
    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet" />
  `;

  document.body.appendChild(styleDiv);
};

const getItemCurrentState = (item) => {
  return item.history[item.history.length - 1];
};

export const setColor = (NAMESPACE) => (item, color) => {
  const state = getItemCurrentState(item);

  return callService(SERVICES.SET_COLOR, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    color: color
  });
};

export const setNote = (NAMESPACE) => (item, note) => {
  const state = getItemCurrentState(item);

  return callService(SERVICES.SET_NOTE, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    note: note
  });
};
