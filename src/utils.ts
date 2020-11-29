export const textContentWithSeparator = (rootNode) => {
  const { childNodes } = rootNode;
  let result = '';

  for (let i = 0; i < childNodes.length; i++) {
    if (childNodes[i].nodeType === 3) {
      result += childNodes[i].nodeValue + ' ';
    }
    else if (childNodes[i].nodeType === 1) {
      result += textContentWithSeparator(childNodes[i]);
    }
  }

  return result;
};

export const removeUnnecessaryWhitespace = (text) => {
  return text.replace(/\s\s+/g, ' ').trim();
};
