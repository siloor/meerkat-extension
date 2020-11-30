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

var NAMESPACE = 'ingatlan.jofogas.hu';
var PROPERTIES = {
    TITLE: 'title',
    PRICE: 'price',
    URL: 'url',
    PICTURE: 'picture',
    DESCRIPTION: 'description'
};
var propertiesToCheck = [
    { name: PROPERTIES.TITLE, title: 'Cím', type: PROPERTY_TYPES.TEXT },
    { name: PROPERTIES.PRICE, title: 'Ár', type: PROPERTY_TYPES.NUMBER },
    { name: PROPERTIES.URL, title: 'Url', type: PROPERTY_TYPES.URL },
    { name: PROPERTIES.PICTURE, title: 'Kép', type: PROPERTY_TYPES.IMAGE },
    { name: PROPERTIES.DESCRIPTION, title: 'Leírás', type: PROPERTY_TYPES.TEXT }
];
var getId = function (path) {
    return path.split('/').pop().split('.').slice(0, -1).join('.').split('_').pop();
};
var getDescription = function (item) {
    return removeUnnecessaryWhitespace([
        textContentWithSeparator(item.querySelector('.sizeRooms')),
        textContentWithSeparator(item.querySelector('.cityname'))
    ].join(' '));
};
var getItemData = function (item) {
    var _a;
    var link = item.querySelector('.item-title a');
    return _a = {},
        _a[BASE_PROPERTIES.ID] = getId(link.pathname),
        _a[PROPERTIES.TITLE] = link.textContent.trim(),
        _a[PROPERTIES.PRICE] = removeUnnecessaryWhitespace(item.querySelector('.item-price').textContent),
        _a[PROPERTIES.URL] = link.href,
        _a[PROPERTIES.PICTURE] = item.querySelector('.imageBox img').getAttribute('data-src'),
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
    var list = document.getElementsByClassName('list-items');
    if (list.length) {
        var items_1 = [].slice.call(list[0].getElementsByClassName('list-item'));
        chrome.runtime.sendMessage({
            message: SERVICES.GET_LIST,
            items: items_1.map(function (item) { return getItemData(item); }),
            namespace: NAMESPACE,
            propertiesToCheck: propertiesToCheck.map(function (property) { return property.name; }),
            version: 1
        }, function (response) {
            for (var i = 0; i < items_1.length; i++) {
                var div = document.createElement('div');
                div.style.position = 'absolute';
                div.style.bottom = '0px';
                items_1[i].getElementsByClassName('contentArea')[0].appendChild(div);
                getToolbar().initToolbar(div, response.items[i], propertiesToCheck, stringToPrice, openComments);
            }
        });
    }
};
start();
