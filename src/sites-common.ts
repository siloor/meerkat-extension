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

export const addFlag = (NAMESPACE) => (item, title) => {
  const state = getItemCurrentState(item);

  return callService(SERVICES.ADD_FLAG, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    title: title
  });
};

export const removeFlag = (NAMESPACE) => (item, title) => {
  const state = getItemCurrentState(item);

  return callService(SERVICES.REMOVE_FLAG, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID],
    title: title
  });
};

export const getFlags = (NAMESPACE) => (item) => {
  const state = getItemCurrentState(item);

  return callService(SERVICES.GET_FLAGS, {
    namespace: NAMESPACE,
    id: state[BASE_PROPERTIES.ID]
  });
};
