import { SERVICES } from './constants';
import { getTranslations } from './translations';

const { html, render, useEffect, useState } = window['htmPreact'];

const translations = getTranslations({
  en: {
    storageTitle: 'Storage',
    storageDomainLabel: 'Domain',
    storageSizeLabel: 'Size',
    deleteButton: 'Delete'
  },
  hu: {
    storageTitle: 'Tárolt adatok',
    storageDomainLabel: 'Domain',
    storageSizeLabel: 'Méret',
    deleteButton: 'Törlés'
  }
});

const getNamespacesInfo = () => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      message: SERVICES.GET_NAMESPACES_INFO
    }, (response) => {
      resolve(response.namespaces);
    });
  });
};

const clearNamespace = (namespace) => {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      message: SERVICES.CLEAR_NAMESPACE,
      namespace: namespace
    }, () => {
      resolve();
    });
  });
};

const faviconMap = {
  'hasznaltauto.hu': 'https://www.hasznaltauto.hu/favicon.ico',
  'ingatlan.jofogas.hu': 'https://ingatlan.jofogas.hu/img/favicon.ico',
  'ingatlan.com': 'https://ingatlan.com/images/favicons/favicon.ico',
  'mobile.de': 'https://suchen.mobile.de/favicon.ico',
  'immobilienscout24.de': 'https://www.immobilienscout24.de/favicon.ico'
};

const Options = () => {
  const [namespaces, setNamespaces] = useState([]);

  const getNamespacesInfoAsync = async () => {
    setNamespaces(await getNamespacesInfo());
  };

  const clearNamespaceAsync = async (namespace) => {
    await clearNamespace(namespace);

    await getNamespacesInfoAsync();
  };

  useEffect(() => {
    getNamespacesInfoAsync();
  }, []);

  const deleteButtonClickHandler = (e) => {
    clearNamespaceAsync(e.currentTarget.getAttribute('data-namespace'));
  };

  return html`
    <h4>${translations.storageTitle}</h4>
    <table id="storage-info">
      <thead>
      <th>${translations.storageDomainLabel}</th>
      <th>${translations.storageSizeLabel}</th>
      <th></th>
      </thead>
      <tbody>
        ${namespaces.map(namespace => html`
          <tr>
            <td><img src="${faviconMap[namespace.name] || ''}" width="16" height="16" style="margin: 0 3px -3px 0;" /> ${namespace.name}</td>
            <td>${namespace.megaBytesInUse} MB</td>
            <td><button data-namespace="${namespace.name}" onClick=${deleteButtonClickHandler}>${translations.deleteButton}</button></td>
          </tr>
        `)}
      </tbody>
    </table>
  `;
};

render(html`<${Options} />`, document.getElementById('root'));
