export const getTranslations = (translations) => {
  const language = window.navigator.language.split('-')[0];
  const allowedLanguages = ['en', 'hu'];

  return translations[allowedLanguages.indexOf(language) === -1 ? 'en' : language] || translations[Object.keys(translations)[0]];
};
