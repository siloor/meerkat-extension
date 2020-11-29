/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

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

var initAnalytics = function () {
    // Standard Google Universal Analytics code
    (function (i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function () {
            (i[r].q = i[r].q || []).push(arguments);
        }, i[r].l = (new Date()).getTime();
        a = s.createElement(o),
            m = s.getElementsByTagName(o)[0];
        a.async = 1;
        a.src = g;
        m.parentNode.insertBefore(a, m);
    })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga'); // Note: https protocol here
    window['ga']('create', 'UA-127764423-2', 'auto');
    window['ga']('set', 'checkProtocolTask', function () { }); // Removes failing protocol check. @see: http://stackoverflow.com/a/22152353/1958200
    window['ga']('require', 'displayfeatures');
    window['ga']('send', 'pageview', '/background.html'); // Specify the virtual path
};
var sendEvent = function (category, action, label) {
    window['ga']('send', 'event', category, action, label);
};

var getItemStorageKey = function (namespace, id) {
    return "item_" + namespace + "_" + id;
};
var getNamespaceFromStorageKey = function (key) {
    var parts = key.split('_');
    return parts.length > 1 ? parts[1] : null;
};
var getDisqusIdentifier = function (namespace, id) {
    return namespace + "_" + id;
};
var getIsNewState = function (lastSavedItem, item, propertiesToCheck) {
    if (lastSavedItem === null) {
        return true;
    }
    for (var _i = 0, propertiesToCheck_1 = propertiesToCheck; _i < propertiesToCheck_1.length; _i++) {
        var propertyToCheck = propertiesToCheck_1[_i];
        if (lastSavedItem[propertyToCheck] !== item[propertyToCheck]) {
            return true;
        }
    }
    return false;
};
var getCommentsCount = function (namespace, ids, cb) {
    var idsParam = ids.map(function (id) { return "&thread[]=ident:/" + getDisqusIdentifier(namespace, id); }).join('');
    var apiKey = 'E8Uh5l5fHZ6gD8U3KycjAIAk46f68Zw7C6eW8WSjZvCLXebZ7p0r1yrYDrLilk2F';
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://disqus.com/api/3.0/threads/set.json?forum=meerkat-for-a-transparent-market&api_key=" + apiKey + idsParam, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4) {
            var resp = JSON.parse(xhr.responseText);
            var countMap = {};
            for (var _i = 0, _a = resp.response; _i < _a.length; _i++) {
                var thread = _a[_i];
                var id = thread.identifiers[0].replace(/^\//, '').replace(namespace + "_", '');
                countMap[id] = thread.posts;
            }
            var result = {};
            for (var _b = 0, ids_1 = ids; _b < ids_1.length; _b++) {
                var id = ids_1[_b];
                result[id] = countMap[id] ? countMap[id] : 0;
            }
            cb(result);
        }
    };
    xhr.send();
};
var getList = function (sendResponse, namespace, propertiesToCheck, version, items, timestamp) {
    var originalOrder = items.map(function (item) { return item[BASE_PROPERTIES.ID]; });
    chrome.storage.local.get(items.map(function (item) { return getItemStorageKey(namespace, item[BASE_PROPERTIES.ID]); }), function (savedItems) {
        var _a;
        for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
            var item = items_1[_i];
            var key = getItemStorageKey(namespace, item[BASE_PROPERTIES.ID]);
            if (!savedItems[key]) {
                savedItems[key] = [];
            }
            if (getIsNewState(savedItems[key].length === 0 ? null : savedItems[key][savedItems[key].length - 1], item, propertiesToCheck)) {
                savedItems[key].push(__assign(__assign({}, item), (_a = {}, _a[BASE_PROPERTIES.CREATED_TIMESTAMP] = timestamp, _a[BASE_PROPERTIES.UPDATED_TIMESTAMP] = null, _a[BASE_PROPERTIES.VERSION] = version, _a)));
            }
            else {
                savedItems[key][savedItems[key].length - 1][BASE_PROPERTIES.UPDATED_TIMESTAMP] = timestamp;
            }
        }
        chrome.storage.local.set(savedItems, function () {
            var itemsHistory = Object.values(savedItems);
            itemsHistory.sort(function (a, b) {
                var aIndex = originalOrder.indexOf(a[0][BASE_PROPERTIES.ID]);
                var bIndex = originalOrder.indexOf(b[0][BASE_PROPERTIES.ID]);
                if (aIndex === bIndex) {
                    return 0;
                }
                return aIndex > bIndex ? 1 : -1;
            });
            getCommentsCount(namespace, itemsHistory.map(function (history) { return history[0][BASE_PROPERTIES.ID]; }), function (commentCountMap) {
                var itemObjects = itemsHistory.map(function (history) { return ({
                    history: history,
                    commentCount: commentCountMap[history[0][BASE_PROPERTIES.ID]]
                }); });
                sendResponse({ items: itemObjects });
            });
        });
    });
};
var getNamespacesInfo = function (sendResponse) {
    chrome.storage.local.get(null, function (items) {
        var namespaces = {};
        for (var _i = 0, _a = Object.keys(items); _i < _a.length; _i++) {
            var itemKey = _a[_i];
            var namespace = getNamespaceFromStorageKey(itemKey);
            if (!namespaces[namespace]) {
                namespaces[namespace] = {
                    keys: [],
                    megaBytesInUse: null
                };
            }
            namespaces[namespace].keys.push(itemKey);
        }
        var remainingBytesInUse = Object.keys(namespaces).length;
        var _loop_1 = function (namespace) {
            chrome.storage.local.getBytesInUse(namespaces[namespace].keys, function (bytesInUse) {
                remainingBytesInUse--;
                namespaces[namespace].megaBytesInUse = Math.round((bytesInUse / 1024 / 1024) * 100) / 100;
                if (remainingBytesInUse === 0) {
                    sendResponse({
                        namespaces: Object.keys(namespaces).map(function (namespace) {
                            return {
                                name: namespace,
                                megaBytesInUse: namespaces[namespace].megaBytesInUse
                            };
                        })
                    });
                }
            });
        };
        for (var _b = 0, _c = Object.keys(namespaces); _b < _c.length; _b++) {
            var namespace = _c[_b];
            _loop_1(namespace);
        }
    });
};
var clearNamespace = function (sendResponse, namespace) {
    chrome.storage.local.get(null, function (items) {
        var keys = [];
        for (var _i = 0, _a = Object.keys(items); _i < _a.length; _i++) {
            var itemKey = _a[_i];
            var namespaceFromKey = getNamespaceFromStorageKey(itemKey);
            if (namespaceFromKey === namespace) {
                keys.push(itemKey);
            }
        }
        chrome.storage.local.remove(keys, function () {
            sendResponse({ success: true });
        });
    });
};
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === SERVICES.GET_LIST) {
        sendEvent('extension', 'getList', request.namespace);
        getList(sendResponse, request.namespace, request.propertiesToCheck, request.version, request.items, (new Date()).getTime());
        return true;
    }
    else if (request.message === SERVICES.GET_NAMESPACES_INFO) {
        getNamespacesInfo(sendResponse);
        return true;
    }
    else if (request.message === SERVICES.CLEAR_NAMESPACE) {
        clearNamespace(sendResponse, request.namespace);
        return true;
    }
    else if (request.message === SERVICES.OPEN_COMMENTS) {
        var width = 900;
        var height = 700;
        var left = (screen.width - width) / 2;
        var top_1 = (screen.height - height) / 2;
        var data_1 = {
            disqusIdentifier: getDisqusIdentifier(request.namespace, request.id),
            title: request.title,
            description: request.description,
            picture: request.picture
        };
        window.open("popup.html?data=" + encodeURIComponent(JSON.stringify(data_1)), 'extension_popup', "width=" + width + ",height=" + height + ",top=" + top_1 + ",left=" + left);
        return true;
    }
});
initAnalytics();
