var BASE_PROPERTIES = {
    ID: 'id',
    CREATED_TIMESTAMP: '_cts',
    UPDATED_TIMESTAMP: '_uts',
    VERSION: '_v'
};
var SERVICES = {
    GET_LIST: 'get_list',
    GET_NAMESPACES_INFO: 'get_namespaces_info',
    CLEAR_NAMESPACE: 'clear_namespace',
    OPEN_COMMENTS: 'open_comments'
};

var textContentWithSeparator = function (rootNode) {
    var childNodes = rootNode.childNodes;
    var result = '';
    for (var i = 0; i < childNodes.length; i++) {
        if (childNodes[i].nodeType === 3) {
            result += childNodes[i].nodeValue + ' ';
        }
        else if (childNodes[i].nodeType === 1) {
            result += textContentWithSeparator(childNodes[i]);
        }
    }
    return result;
};
var removeUnnecessaryWhitespace = function (text) {
    return text.replace(/\s\s+/g, ' ').trim();
};

var getContainer = function () {
    var windowWithContainer = window;
    if (!windowWithContainer.container) {
        windowWithContainer.container = {};
    }
    return windowWithContainer.container;
};
var getToolbar = function () {
    return getContainer().toolbar;
};

var _a;
var NAMESPACE = 'hasznaltauto.hu';
var PROPERTIES = {
    TITLE: 'title',
    PRICE: 'price',
    URL: 'url',
    PICTURE: 'picture',
    DESCRIPTION: 'description'
};
var propertiesToCheck = [
    PROPERTIES.TITLE,
    PROPERTIES.PRICE,
    PROPERTIES.URL,
    PROPERTIES.PICTURE,
    PROPERTIES.DESCRIPTION
];
var propertiesToCheckTranslations = (_a = {},
    _a[PROPERTIES.TITLE] = 'Cím',
    _a[PROPERTIES.PRICE] = 'Ár',
    _a[PROPERTIES.URL] = 'Url',
    _a[PROPERTIES.PICTURE] = 'Kép',
    _a[PROPERTIES.DESCRIPTION] = 'Leírás',
    _a);
var getId = function (path) {
    var parts = path.split('/');
    if (parts.length < 5) {
        return null;
    }
    var id = parts[4].split('-');
    return id[id.length - 1];
};
var getDescription = function (item) {
    var div = document.createElement('div');
    div.innerHTML = item.querySelector('.talalatisor-infokontener').innerHTML;
    div.querySelector('.tavolsaginfo').remove();
    div.querySelector('.talalatisor-hirkod').remove();
    return removeUnnecessaryWhitespace(textContentWithSeparator(div));
};
var getItemData = function (item) {
    var _a;
    var link = item.querySelector('h3 a');
    return _a = {},
        _a[BASE_PROPERTIES.ID] = getId(link.pathname),
        _a[PROPERTIES.TITLE] = link.textContent,
        _a[PROPERTIES.PRICE] = item.querySelector('.vetelar').textContent,
        _a[PROPERTIES.URL] = link.href,
        _a[PROPERTIES.PICTURE] = item.querySelector('.talalatisor-kep a img').getAttribute('data-lazyurl'),
        _a[PROPERTIES.DESCRIPTION] = getDescription(item),
        _a;
};
var stringToPrice = function (price) {
    var value = parseFloat(price.replace(/(?!-)[^0-9.]/g, ''));
    return {
        value: isNaN(value) ? null : value,
        currency: isNaN(value) ? null : removeUnnecessaryWhitespace(price.replace(/[0-9.-]/g, ''))
    };
};
var openComments = function (item) {
    var state = item.history[item.history.length - 1];
    chrome.runtime.sendMessage({
        message: SERVICES.OPEN_COMMENTS,
        namespace: NAMESPACE,
        id: state[BASE_PROPERTIES.ID],
        title: state[PROPERTIES.TITLE],
        description: state[PROPERTIES.DESCRIPTION],
        picture: state[PROPERTIES.PICTURE]
    }, function (response) { });
};
var start = function () {
    if (window.location.pathname.indexOf('/talalatilista') === 0) {
        var items_1 = [].slice.call(document.getElementsByClassName('talalati-sor'));
        chrome.runtime.sendMessage({
            message: SERVICES.GET_LIST,
            items: items_1.map(function (item) { return getItemData(item); }),
            namespace: NAMESPACE,
            propertiesToCheck: propertiesToCheck,
            version: 1
        }, function (response) {
            for (var i = 0; i < items_1.length; i++) {
                var div = document.createElement('div');
                div.style.float = 'left';
                div.style.width = '100%';
                items_1[i].appendChild(div);
                getToolbar().initToolbar(div, response.items[i], propertiesToCheck, propertiesToCheckTranslations, stringToPrice, openComments);
            }
        });
    }
};
start();
