/*document.querySelector('#go-to-options').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});*/

const urlParams = new URLSearchParams(window.location.search);
const data = JSON.parse(urlParams.get('data'));

document.title = data.title || data.description;
document.querySelector('#info-picture').setAttribute('src', data.picture);
document.querySelector('#info-title').innerHTML = data.title;
document.querySelector('#info-description').innerHTML = data.description;

document.querySelector('#disqus-comments').setAttribute(
  'src',
  `https://siloor.github.io/meerkat-for-a-transparent-market/disqus.html?id=${encodeURIComponent(data.disqusIdentifier)}`
);
