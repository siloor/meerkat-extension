export const getLocale = () => {
  return chrome.i18n.getMessage('appLocale');
};

export const getTranslations = (translations) => {
  return translations[getLocale()] || translations[Object.keys(translations)[0]];
};
