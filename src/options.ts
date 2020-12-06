import { SERVICES } from './constants';

const deleteButtonClickHandler = (e) => {
  chrome.runtime.sendMessage({
    message: SERVICES.CLEAR_NAMESPACE,
    namespace: e.currentTarget.getAttribute('data-namespace')
  }, (response) => {
    renderStorageInfo();
  });
};

const renderStorageInfo = () => {
  const translations = {
    storageTitle: 'Tárolt adatok',
    storageDomainLabel: 'Domain',
    storageSizeLabel: 'Méret',
    deleteButton: 'Törlés'
  };

  document.getElementsByClassName('options-block')[0].innerHTML = `
    <h4>${translations.storageTitle}</h4>
    <table id="storage-info">
      <thead>
      <th>${translations.storageDomainLabel}</th>
      <th>${translations.storageSizeLabel}</th>
      <th></th>
      </thead>
      <tbody></tbody>
    </table>
  `;

  chrome.runtime.sendMessage({
    message: SERVICES.GET_NAMESPACES_INFO
  }, (response) => {
    const storageInfoContainer = document.getElementById('storage-info').getElementsByTagName('tbody')[0];

    const faviconMap = {
      'hasznaltauto.hu': 'https://www.hasznaltauto.hu/favicon.ico',
      'ingatlan.jofogas.hu': 'https://ingatlan.jofogas.hu/img/favicon.ico',
      'ingatlan.com': 'https://ingatlan.com/images/favicons/favicon.ico'
    };

    storageInfoContainer.innerHTML = response.namespaces.map(namespace => `
      <tr>
        <td><img src="${faviconMap[namespace.name] || ''}" width="16" height="16" style="margin: 0 3px -3px 0;" /> ${namespace.name}</td>
        <td>${namespace.megaBytesInUse} MB</td>
        <td><button data-namespace="${namespace.name}">${translations.deleteButton}</button></td>
      </tr>
    `).join('');

    const buttons = storageInfoContainer.getElementsByTagName('button');

    for (let i = 0; i< buttons.length; i++) {
      buttons[i].addEventListener('click', deleteButtonClickHandler);
    }
  });
};

renderStorageInfo();
