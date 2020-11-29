var SERVICES = {
    GET_LIST: 'get_list',
    GET_NAMESPACES_INFO: 'get_namespaces_info',
    CLEAR_NAMESPACE: 'clear_namespace',
    OPEN_COMMENTS: 'open_comments'
};

var deleteButtonClickHandler = function (e) {
    chrome.runtime.sendMessage({
        message: SERVICES.CLEAR_NAMESPACE,
        namespace: e.currentTarget.getAttribute('data-namespace')
    }, function (response) {
        renderStorageInfo();
    });
};
var renderStorageInfo = function () {
    chrome.runtime.sendMessage({
        message: SERVICES.GET_NAMESPACES_INFO
    }, function (response) {
        var storageInfoContainer = document.getElementById('storage-info').getElementsByTagName('tbody')[0];
        var faviconMap = {
            'hasznaltauto.hu': 'https://www.hasznaltauto.hu/favicon.ico',
            'ingatlan.jofogas.hu': 'https://ingatlan.jofogas.hu/img/favicon.ico',
            'ingatlan.com': 'https://ingatlan.com/images/favicons/favicon.ico'
        };
        storageInfoContainer.innerHTML = response.namespaces.map(function (namespace) { return "\n    <tr>\n      <td><img src=\"" + (faviconMap[namespace.name] || '') + "\" width=\"16\" height=\"16\" style=\"margin: 0 3px -3px 0;\" /> " + namespace.name + "</td>\n      <td>" + namespace.megaBytesInUse + " MB</td>\n      <td><button data-namespace=\"" + namespace.name + "\">T\u00F6rl\u00E9s</button></td>\n    </tr>\n  "; }).join('');
        var buttons = storageInfoContainer.getElementsByTagName('button');
        for (var i = 0; i < buttons.length; i++) {
            buttons[i].addEventListener('click', deleteButtonClickHandler);
        }
    });
};
renderStorageInfo();
