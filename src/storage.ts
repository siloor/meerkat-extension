export const storage = {
  get: (keys: string | string[] | Object | null): Promise<{ [key: string]: any }> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(keys, (items) => {
        const err = chrome.runtime.lastError;

        if (err) {
          reject(err);
        } else {
          resolve(items);
        }
      });
    });
  },
  set: (items: Object) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set(items, () => {
        const err = chrome.runtime.lastError;

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  getBytesInUse: (keys: string | string[] | null): Promise<number> => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.getBytesInUse(keys, (bytesInUse) => {
        const err = chrome.runtime.lastError;

        if (err) {
          reject(err);
        } else {
          resolve(bytesInUse);
        }
      });
    });
  },
  remove: (keys: string | string[]) => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.remove(keys, () => {
        const err = chrome.runtime.lastError;

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  clear: () => {
    return new Promise((resolve, reject) => {
      chrome.storage.local.clear(() => {
        const err = chrome.runtime.lastError;

        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
};
