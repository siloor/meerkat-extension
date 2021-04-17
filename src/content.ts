import { RUN_CONTENT_SCRIPT } from './constants';

chrome.runtime.sendMessage(
  {
    message: RUN_CONTENT_SCRIPT
  },
  (response) => {}
);
