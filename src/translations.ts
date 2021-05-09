const getLanguage = () => {
  return chrome.i18n.getMessage('appLocale');
};

export const getTranslations = (translations) => {
  return translations[getLanguage()] || translations[Object.keys(translations)[0]];
};
