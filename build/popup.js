/*document.querySelector('#go-to-options').addEventListener('click', function() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL('options.html'));
  }
});*/
var urlParams = new URLSearchParams(window.location.search);
var data = JSON.parse(urlParams.get('data'));
document.title = data.title || data.description;
document.querySelector('#info-picture').setAttribute('src', data.picture);
document.querySelector('#info-title').innerHTML = data.title;
document.querySelector('#info-description').innerHTML = data.description;
document.querySelector('#disqus-comments').setAttribute('src', "https://siloor.com/public/meerkat/?id=" + encodeURIComponent(data.disqusIdentifier));
