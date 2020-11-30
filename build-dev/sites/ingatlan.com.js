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
var PROPERTY_TYPES = {
    NUMBER: 'number',
    TEXT: 'text',
    URL: 'url',
    IMAGE: 'image'
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

var NAMESPACE = 'ingatlan.com';
var PROPERTIES = {
    PRICE: 'price',
    URL: 'url',
    PICTURE: 'picture',
    DESCRIPTION: 'description'
};
var propertiesToCheck = [
    { name: PROPERTIES.PRICE, title: 'Ár', type: PROPERTY_TYPES.NUMBER },
    { name: PROPERTIES.URL, title: 'Url', type: PROPERTY_TYPES.URL },
    { name: PROPERTIES.PICTURE, title: 'Kép', type: PROPERTY_TYPES.IMAGE },
    { name: PROPERTIES.DESCRIPTION, title: 'Leírás', type: PROPERTY_TYPES.TEXT }
];
var getId = function (path) {
    var parts = path.split('/');
    if (parts.length < 5) {
        return null;
    }
    return parts[4];
};
var getDescription = function (item) {
    var div = document.createElement('div');
    div.innerHTML = item.querySelector('.listing__link').innerHTML;
    div.querySelector('.listing__price').remove();
    return removeUnnecessaryWhitespace(textContentWithSeparator(div));
};
var getItemData = function (item) {
    var _a;
    var picture = item.querySelector('.listing__thumbnail img');
    var link = item.querySelector('.listing__link');
    return _a = {},
        _a[BASE_PROPERTIES.ID] = getId(link.pathname),
        _a[PROPERTIES.PRICE] = item.querySelector('.price').textContent.trim(),
        _a[PROPERTIES.URL] = link.href,
        _a[PROPERTIES.PICTURE] = picture ? picture.getAttribute('src') : null,
        _a[PROPERTIES.DESCRIPTION] = getDescription(item),
        _a;
};
var stringToPrice = function (price) {
    var isMillion = price.indexOf(' M ') !== -1;
    if (isMillion) {
        price = price.replace(/ M /, ' ');
    }
    return {
        value: parseFloat(price.replace(/(?!-)[^0-9.]/g, '')) * (isMillion ? 1000000 : 1),
        currency: removeUnnecessaryWhitespace(price.replace(/[0-9.-]/g, ''))
    };
};
var openComments = function (item) {
    var state = item.history[item.history.length - 1];
    chrome.runtime.sendMessage({
        message: SERVICES.OPEN_COMMENTS,
        namespace: NAMESPACE,
        id: state[BASE_PROPERTIES.ID],
        title: '',
        description: state[PROPERTIES.DESCRIPTION],
        picture: state[PROPERTIES.PICTURE]
    }, function (response) { });
};
var start = function () {
    if (window.location.pathname.indexOf('/lista') === 0 || window.location.pathname.indexOf('/szukites') === 0) {
        var items_1 = [].slice.call(document.getElementsByClassName('listing'));
        chrome.runtime.sendMessage({
            message: SERVICES.GET_LIST,
            items: items_1.map(function (item) { return getItemData(item); }),
            namespace: NAMESPACE,
            propertiesToCheck: propertiesToCheck.map(function (property) { return property.name; }),
            version: 1
        }, function (response) {
            for (var i = 0; i < items_1.length; i++) {
                var div = document.createElement('div');
                div.style.float = 'left';
                div.style.width = '100%';
                div.style.position = 'relative';
                div.style.zIndex = '150';
                items_1[i].appendChild(div);
                getToolbar().initToolbar(div, response.items[i], propertiesToCheck, stringToPrice, openComments);
            }
        });
    }
};
start();
