chrome.runtime.sendMessage(
  {
    message: 'runContentScript'
  },
  (response) => {}
);
