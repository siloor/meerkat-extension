const getLanguage = () => {
  const allowedLanguages = ['en', 'hu'];
  const languageIndex = allowedLanguages.indexOf(window.navigator.language.split('-')[0]);

  return allowedLanguages[languageIndex === -1 ? 0 : languageIndex];
};

export const getTranslations = (translations) => {
  return translations[getLanguage()] || translations[Object.keys(translations)[0]];
};
