export const getLanguage = () => {
  const language = window.navigator.language.split('-')[0];
  const allowedLanguages = ['en', 'hu'];

  return allowedLanguages.indexOf(language) === -1 ? 'en' : language;
};

export const getTranslations = (translations) => {
  return translations[getLanguage()] || translations[Object.keys(translations)[0]];
};
