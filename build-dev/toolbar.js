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

// https://github.com/soxhub/htmldiff.js

var Match, calculate_operations, consecutive_where, create_index, diff, find_match, find_matching_blocks, html_to_tokens, is_end_of_tag, is_start_of_tag, is_tag, is_whitespace, isnt_tag, op_map, recursively_find_matching_blocks, render_operations, wrap;

is_end_of_tag = function(char) {
  return char === '>';
};

is_start_of_tag = function(char) {
  return char === '<';
};

is_whitespace = function(char) {
  return /^\s+$/.test(char);
};

is_tag = function(token) {
  return /^\s*<[^>]+>\s*$/.test(token);
};

img_tag = function(token) {
  return /^\s*<img[^>]+>\s*$/.test(token);
};

isnt_tag = function(token) {
  return !is_tag(token) || img_tag(token);
};

is_tag_except_img = function(token) {
  return is_tag(token) && !img_tag(token);
};

Match = (function() {
  function Match(start_in_before1, start_in_after1, length1) {
    this.start_in_before = start_in_before1;
    this.start_in_after = start_in_after1;
    this.length = length1;
    this.end_in_before = (this.start_in_before + this.length) - 1;
    this.end_in_after = (this.start_in_after + this.length) - 1;
  }

  return Match;

})();

html_to_tokens = function(html) {
  var char, current_word, i, len, mode, words;
  mode = 'char';
  current_word = '';
  words = [];
  for (i = 0, len = html.length; i < len; i++) {
    char = html[i];
    switch (mode) {
      case 'tag':
        if (is_end_of_tag(char)) {
          current_word += '>';
          words.push(current_word);
          current_word = '';
          if (is_whitespace(char)) {
            mode = 'whitespace';
          } else {
            mode = 'char';
          }
        } else {
          current_word += char;
        }
        break;
      case 'char':
        if (is_start_of_tag(char)) {
          if (current_word) {
            words.push(current_word);
          }
          current_word = '<';
          mode = 'tag';
        } else if (/\s/.test(char)) {
          if (current_word) {
            words.push(current_word);
          }
          current_word = char;
          mode = 'whitespace';
        } else if (/[\w\#@]+/i.test(char)) {
          current_word += char;
        } else {
          if (current_word) {
            words.push(current_word);
          }
          current_word = char;
        }
        break;
      case 'whitespace':
        if (is_start_of_tag(char)) {
          if (current_word) {
            words.push(current_word);
          }
          current_word = '<';
          mode = 'tag';
        } else if (is_whitespace(char)) {
          current_word += char;
        } else {
          if (current_word) {
            words.push(current_word);
          }
          current_word = char;
          mode = 'char';
        }
        break;
      default:
        throw new Error("Unknown mode " + mode);
    }
  }
  if (current_word) {
    words.push(current_word);
  }
  return words;
};

find_match = function(before_tokens, after_tokens, index_of_before_locations_in_after_tokens, start_in_before, end_in_before, start_in_after, end_in_after) {
  var best_match_in_after, best_match_in_before, best_match_length, i, index_in_after, index_in_before, j, len, locations_in_after, looking_for, match, match_length_at, new_match_length, new_match_length_at, ref, ref1;
  best_match_in_before = start_in_before;
  best_match_in_after = start_in_after;
  best_match_length = 0;
  match_length_at = {};
  for (index_in_before = i = ref = start_in_before, ref1 = end_in_before; ref <= ref1 ? i < ref1 : i > ref1; index_in_before = ref <= ref1 ? ++i : --i) {
    new_match_length_at = {};
    looking_for = before_tokens[index_in_before];
    locations_in_after = index_of_before_locations_in_after_tokens[looking_for];
    for (j = 0, len = locations_in_after.length; j < len; j++) {
      index_in_after = locations_in_after[j];
      if (index_in_after < start_in_after) {
        continue;
      }
      if (index_in_after >= end_in_after) {
        break;
      }
      if (match_length_at[index_in_after - 1] == null) {
        match_length_at[index_in_after - 1] = 0;
      }
      new_match_length = match_length_at[index_in_after - 1] + 1;
      new_match_length_at[index_in_after] = new_match_length;
      if (new_match_length > best_match_length) {
        best_match_in_before = index_in_before - new_match_length + 1;
        best_match_in_after = index_in_after - new_match_length + 1;
        best_match_length = new_match_length;
      }
    }
    match_length_at = new_match_length_at;
  }
  if (best_match_length !== 0) {
    match = new Match(best_match_in_before, best_match_in_after, best_match_length);
  }
  return match;
};

recursively_find_matching_blocks = function(before_tokens, after_tokens, index_of_before_locations_in_after_tokens, start_in_before, end_in_before, start_in_after, end_in_after, matching_blocks) {
  var match;
  match = find_match(before_tokens, after_tokens, index_of_before_locations_in_after_tokens, start_in_before, end_in_before, start_in_after, end_in_after);
  if (match != null) {
    if (start_in_before < match.start_in_before && start_in_after < match.start_in_after) {
      recursively_find_matching_blocks(before_tokens, after_tokens, index_of_before_locations_in_after_tokens, start_in_before, match.start_in_before, start_in_after, match.start_in_after, matching_blocks);
    }
    matching_blocks.push(match);
    if (match.end_in_before <= end_in_before && match.end_in_after <= end_in_after) {
      recursively_find_matching_blocks(before_tokens, after_tokens, index_of_before_locations_in_after_tokens, match.end_in_before + 1, end_in_before, match.end_in_after + 1, end_in_after, matching_blocks);
    }
  }
  return matching_blocks;
};

create_index = function(p) {
  var i, idx, index, len, ref, token;
  if (p.find_these == null) {
    throw new Error('params must have find_these key');
  }
  if (p.in_these == null) {
    throw new Error('params must have in_these key');
  }
  index = {};
  ref = p.find_these;
  for (i = 0, len = ref.length; i < len; i++) {
    token = ref[i];
    index[token] = [];
    idx = p.in_these.indexOf(token);
    while (idx !== -1) {
      index[token].push(idx);
      idx = p.in_these.indexOf(token, idx + 1);
    }
  }
  return index;
};

find_matching_blocks = function(before_tokens, after_tokens) {
  var index_of_before_locations_in_after_tokens, matching_blocks;
  matching_blocks = [];
  index_of_before_locations_in_after_tokens = create_index({
    find_these: before_tokens,
    in_these: after_tokens
  });
  return recursively_find_matching_blocks(before_tokens, after_tokens, index_of_before_locations_in_after_tokens, 0, before_tokens.length, 0, after_tokens.length, matching_blocks);
};

calculate_operations = function(before_tokens, after_tokens) {
  var action_map, action_up_to_match_positions, i, index, is_single_whitespace, j, last_op, len, len1, match, match_starts_at_current_position_in_after, match_starts_at_current_position_in_before, matches, op, operations, position_in_after, position_in_before, post_processed;
  if (before_tokens == null) {
    throw new Error('before_tokens?');
  }
  if (after_tokens == null) {
    throw new Error('after_tokens?');
  }
  position_in_before = position_in_after = 0;
  operations = [];
  action_map = {
    'false,false': 'replace',
    'true,false': 'insert',
    'false,true': 'delete',
    'true,true': 'none'
  };
  matches = find_matching_blocks(before_tokens, after_tokens);
  matches.push(new Match(before_tokens.length, after_tokens.length, 0));
  for (index = i = 0, len = matches.length; i < len; index = ++i) {
    match = matches[index];
    match_starts_at_current_position_in_before = position_in_before === match.start_in_before;
    match_starts_at_current_position_in_after = position_in_after === match.start_in_after;
    action_up_to_match_positions = action_map[[match_starts_at_current_position_in_before, match_starts_at_current_position_in_after].toString()];
    if (action_up_to_match_positions !== 'none') {
      operations.push({
        action: action_up_to_match_positions,
        start_in_before: position_in_before,
        end_in_before: (action_up_to_match_positions !== 'insert' ? match.start_in_before - 1 : void 0),
        start_in_after: position_in_after,
        end_in_after: (action_up_to_match_positions !== 'delete' ? match.start_in_after - 1 : void 0)
      });
    }
    if (match.length !== 0) {
      operations.push({
        action: 'equal',
        start_in_before: match.start_in_before,
        end_in_before: match.end_in_before,
        start_in_after: match.start_in_after,
        end_in_after: match.end_in_after
      });
    }
    position_in_before = match.end_in_before + 1;
    position_in_after = match.end_in_after + 1;
  }
  post_processed = [];
  last_op = {
    action: 'none'
  };
  is_single_whitespace = function(op) {
    if (op.action !== 'equal') {
      return false;
    }
    if (op.end_in_before - op.start_in_before !== 0) {
      return false;
    }
    return /^\s$/.test(before_tokens.slice(op.start_in_before, +op.end_in_before + 1 || 9e9));
  };
  for (j = 0, len1 = operations.length; j < len1; j++) {
    op = operations[j];
    if (((is_single_whitespace(op)) && last_op.action === 'replace') || (op.action === 'replace' && last_op.action === 'replace')) {
      last_op.end_in_before = op.end_in_before;
      last_op.end_in_after = op.end_in_after;
    } else {
      post_processed.push(op);
      last_op = op;
    }
  }
  return post_processed;
};

consecutive_where = function(start, content, predicate) {
  var answer, i, index, last_matching_index, len, token;
  content = content.slice(start, +content.length + 1 || 9e9);
  last_matching_index = void 0;
  for (index = i = 0, len = content.length; i < len; index = ++i) {
    token = content[index];
    answer = predicate(token);
    if (answer === true) {
      last_matching_index = index;
    }
    if (answer === false) {
      break;
    }
  }
  if (last_matching_index != null) {
    return content.slice(0, +last_matching_index + 1 || 9e9);
  }
  return [];
};

wrap = function(tag, content) {
  var length, non_tags, position, rendering, tags;
  rendering = '';
  position = 0;
  length = content.length;
  while (true) {
    if (position >= length) {
      break;
    }
    non_tags = consecutive_where(position, content, isnt_tag);
    position += non_tags.length;
    if (non_tags.length !== 0) {
      rendering += "<" + tag + ">" + (non_tags.join('')) + "</" + tag + ">";
    }
    if (position >= length) {
      break;
    }
    tags = consecutive_where(position, content, is_tag_except_img);
    position += tags.length;
    rendering += tags.join('');
  }
  return rendering;
};

op_map = {
  equal: function(op, before_tokens, after_tokens) {
    return before_tokens.slice(op.start_in_before, +op.end_in_before + 1 || 9e9).join('');
  },
  insert: function(op, before_tokens, after_tokens) {
    var val;
    val = after_tokens.slice(op.start_in_after, +op.end_in_after + 1 || 9e9);
    return wrap('ins', val);
  },
  "delete": function(op, before_tokens, after_tokens) {
    var val;
    val = before_tokens.slice(op.start_in_before, +op.end_in_before + 1 || 9e9);
    return wrap('del', val);
  }
};

op_map.replace = function(op, before_tokens, after_tokens) {
  return (op_map["delete"](op, before_tokens, after_tokens)) + (op_map.insert(op, before_tokens, after_tokens));
};

render_operations = function(before_tokens, after_tokens, operations) {
  var i, len, op, rendering;
  rendering = '';
  for (i = 0, len = operations.length; i < len; i++) {
    op = operations[i];
    rendering += op_map[op.action](op, before_tokens, after_tokens);
  }
  return rendering;
};

diff = function(before, after) {
  var ops;

  if (before === after) {
    return before;
  }

  if (!before || !before.length) {
    return '<ins>' + after + '</ins>';
  }

  if (!after || !after.length) {
    return '<del>' + before + '</del>';
  }


  before = html_to_tokens(before);
  after = html_to_tokens(after);
  ops = calculate_operations(before, after);
  return render_operations(before, after, ops);
};

diff.html_to_tokens = html_to_tokens;

diff.find_matching_blocks = find_matching_blocks;

find_matching_blocks.find_match = find_match;

find_matching_blocks.create_index = create_index;

diff.calculate_operations = calculate_operations;

diff.render_operations = render_operations;

// htmldiff is the primary function
const diffHTML = diff;

var BASE_PROPERTIES = {
    ID: 'id',
    CREATED_TIMESTAMP: '_cts',
    UPDATED_TIMESTAMP: '_uts',
    VERSION: '_v'
};
var PROPERTY_TYPES = {
    NUMBER: 'number',
    TEXT: 'text',
    URL: 'url',
    IMAGE: 'image'
};

var getContainer = function () {
    var windowWithContainer = window;
    if (!windowWithContainer.container) {
        windowWithContainer.container = {};
    }
    return windowWithContainer.container;
};
var setToolbar = function (toolbar) {
    getContainer().toolbar = toolbar;
};

var timestampToString = function (timestamp) {
    var date = new Date(timestamp);
    return (new Date(date.getTime() - (date.getTimezoneOffset() * 60 * 1000))).toISOString().split('T')[0].replace(/-/g, '.') + '.';
};
var numberToString = function (number) {
    if (number === null) {
        return '-';
    }
    var parts = number.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return parts.join('.');
};
var getTextDiff = function (oldValue, value) {
    return diffHTML(oldValue, value)
        .replace(/<ins/g, '<ins style="text-decoration: none; color: #39b54a;"')
        .replace(/<del/g, '<del style="color: #ff4500;"');
};
var propertyToStyleRuleName = function (name) {
    return name.replace(/[A-Z]/g, function (match) { return "-" + match.toLowerCase(); });
};
var generateStyles = function (styles) {
    var result = __assign({}, styles);
    var _loop_1 = function (key) {
        result[key] = Object.keys(result[key])
            .map(function (prop) { return propertyToStyleRuleName(prop) + ": " + result[key][prop] + ";"; })
            .join(' ');
    };
    for (var _i = 0, _a = Object.keys(result); _i < _a.length; _i++) {
        var key = _a[_i];
        _loop_1(key);
    }
    return result;
};
var renderElement = function (_a) {
    var creationDate = _a.creationDate, days = _a.days, priceDifference = _a.priceDifference, currency = _a.currency, commentCount = _a.commentCount, changes = _a.changes;
    var changesHTML = [];
    var commonStyles = {
        tableHeader: {
            padding: '8px',
            position: 'sticky',
            top: '0',
            background: '#eee',
            boxShadow: 'inset 0 -1px 0 #bbb',
            fontSize: '14px',
            color: '#999'
        },
        logo: {
            display: 'inline-block',
            width: '20px',
            height: '20px',
            lineHeight: '20px',
            borderRadius: '10px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            backgroundColor: '#ccc',
            color: '#fff'
        }
    };
    var styles = generateStyles({
        container: {
            position: 'relative',
            float: 'left',
            background: '#eee',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.16), 0 1px 2px rgba(0,0,0,0.23)',
            fontFamily: '\'Open Sans\', \'Helvetica Neue\', Helvetica, Arial, sans-serif',
            fontSize: '12px'
        },
        logo: __assign({}, commonStyles.logo),
        date: {
            marginLeft: '20px',
            color: '#999'
        },
        priceDifference: {
            marginLeft: '20px',
            fontWeight: priceDifference === 0 || priceDifference === null ? 'normal' : 'bold',
            color: priceDifference === 0 || priceDifference === null ? '#999' : (priceDifference > 0 ? '#ff4500' : '#39b54a')
        },
        changesButton: {
            marginLeft: '20px',
            color: changes.length > 0 ? '#333' : '#999'
        },
        changes: {
            position: 'absolute',
            bottom: '0',
            left: '0',
            background: '#eee',
            width: '0px',
            height: '0px',
            opacity: '0',
            borderRadius: '16px',
            overflow: 'hidden',
            transition: 'width 0.2s, height 0.2s, opacity 0.2s',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.16), 0 1px 2px rgba(0, 0, 0, 0.23)',
            display: 'flex',
            flexDirection: 'column'
        },
        tableContainer: {
            padding: '10px 10px 0 10px',
            overflow: 'auto',
            flexGrow: '1'
        },
        tableContainerInner: {
            width: '100%',
            height: '100%',
            overflow: 'auto'
        },
        table: {
            tableLayout: 'fixed',
            width: '100%'
        },
        tableHeaderType: __assign(__assign({}, commonStyles.tableHeader), { width: '70px' }),
        tableHeaderDate: __assign(__assign({}, commonStyles.tableHeader), { width: '90px' }),
        tableHeaderValue: __assign({}, commonStyles.tableHeader),
        tableCell: {
            padding: '8px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        changesCloseButton: __assign(__assign({}, commonStyles.logo), { margin: '8px' }),
        commentsButton: {
            marginLeft: '20px',
            marginRight: '10px',
            color: commentCount > 0 ? '#333' : '#999'
        }
    });
    var translations = {
        firstSaw: 'Első megtekintés',
        daysAgo: 'napja',
        priceChange: 'Árváltozás',
        changes: 'Változások',
        changesLabelType: 'Típus',
        changesLabelDate: 'Dátum',
        changesLabelValue: 'Érték',
        comments: 'Hozzászólások',
        oldUrl: 'Régi link',
        newUrl: 'Új link',
        oldImage: 'Régi kép',
        newImage: 'Új kép'
    };
    var renderDiff = function (oldValue, value, type) {
        if (type === PROPERTY_TYPES.TEXT) {
            return getTextDiff(oldValue, value);
        }
        else if (type === PROPERTY_TYPES.URL) {
            return "<a href=\"" + (oldValue || '') + "\" target=\"_blank\" style=\"color: #ff4500;\">" + translations.oldUrl + "</a> - <a href=\"" + (value || '') + "\" target=\"_blank\" style=\"color: #39b54a;\">" + translations.newUrl + "</a>";
        }
        else if (type === PROPERTY_TYPES.IMAGE) {
            return "<a href=\"" + (oldValue || '') + "\" target=\"_blank\" style=\"color: #ff4500;\">" + translations.oldImage + "</a> - <a href=\"" + (value || '') + "\" target=\"_blank\" style=\"color: #39b54a;\">" + translations.newImage + "</a>";
        }
        return "<span style=\"color: #ff4500; text-decoration: line-through;\">" + oldValue + "</span> <span style=\"color: #39b54a;\">" + value + "</span>";
    };
    for (var _i = 0, changes_1 = changes; _i < changes_1.length; _i++) {
        var change = changes_1[_i];
        changesHTML.push("\n      <tr>\n        <td style=\"" + styles.tableCell + "\">" + change.property.title + "</td>\n        <td style=\"" + styles.tableCell + "\">" + timestampToString(change.date) + "</td>\n        <td style=\"" + styles.tableCell + "\">" + renderDiff(change.oldValue, change.value, change.property.type) + "</td>\n      </tr>\n    ");
    }
    return "\n<div>\n  <div style=\"" + styles.container + "\">\n    <span style=\"" + styles.logo + "\">M</span>\n    <span style=\"" + styles.date + "\" title=\"" + translations.firstSaw + ": " + timestampToString(creationDate) + "\">" + days + " " + translations.daysAgo + "</span>\n    <span style=\"" + styles.priceDifference + "\" title=\"" + translations.priceChange + "\">" + (priceDifference > 0 ? '+' : '') + numberToString(priceDifference) + (currency === null ? '' : " " + currency) + "</span>\n    <a style=\"" + styles.changesButton + "\" href=\"javascript:void(0);\">" + translations.changes + " (" + changes.length + ")</a>\n    <div style=\"" + styles.changes + "\">\n      <div style=\"" + styles.tableContainer + "\">\n        <div style=\"" + styles.tableContainerInner + "\">\n          <table style=\"" + styles.table + "\">\n            <thead>\n              <th style=\"" + styles.tableHeaderType + "\">" + translations.changesLabelType + "</th>\n              <th style=\"" + styles.tableHeaderDate + "\">" + translations.changesLabelDate + "</th>\n              <th style=\"" + styles.tableHeaderValue + "\">" + translations.changesLabelValue + "</th>\n            </thead>\n            <tbody>\n              " + changesHTML.map(function (html) { return html.trim(); }).join('') + "\n            </tbody>\n          </table>\n        </div>\n      </div>\n      <div>\n        <a href=\"javascript:void(0);\" style=\"" + styles.changesCloseButton + "\">X</a>\n      </div>\n    </div>\n    <a style=\"" + styles.commentsButton + "\" href=\"javascript:void(0);\">" + translations.comments + " (" + commentCount + ")</a>\n  </div>\n</div>\n";
};
var getElementParameters = function (history, commentCount, propertiesToCheck, stringToPrice) {
    var oldPrice = stringToPrice(history[0].price);
    var newPrice = stringToPrice(history[history.length - 1].price);
    var changes = [];
    for (var i = 1; i < history.length; i++) {
        for (var _i = 0, propertiesToCheck_1 = propertiesToCheck; _i < propertiesToCheck_1.length; _i++) {
            var property = propertiesToCheck_1[_i];
            var value = history[i][property.name];
            var oldValue = history[i - 1][property.name];
            if (value === oldValue) {
                continue;
            }
            changes.push({
                property: property,
                date: history[i][BASE_PROPERTIES.CREATED_TIMESTAMP],
                value: value,
                oldValue: oldValue
            });
        }
    }
    return {
        creationDate: history[0][BASE_PROPERTIES.CREATED_TIMESTAMP],
        days: Math.round(((new Date()).getTime() - history[0][BASE_PROPERTIES.CREATED_TIMESTAMP]) / (1000 * 60 * 60 * 24)),
        priceDifference: oldPrice.value === null && newPrice.value === null ? null : newPrice.value - oldPrice.value,
        currency: oldPrice.currency === null ? newPrice.currency : oldPrice.currency,
        commentCount: commentCount,
        changes: changes
    };
};
var initToolbar = function (root, item, propertiesToCheck, stringToPrice, openComments) {
    var parameters = getElementParameters(item.history, item.commentCount, propertiesToCheck, stringToPrice);
    root.innerHTML = renderElement(parameters).trim();
    var element = root.firstElementChild;
    var openButton = element.getElementsByTagName('a')[0];
    var closeButton = element.getElementsByTagName('a')[1];
    var commentsButton = element.getElementsByTagName('a')[2];
    var historyElement = openButton.nextElementSibling;
    var isClosed = true;
    var documentClickHandler = function (e) {
        if (element.contains(e.target)) {
            return;
        }
        toggleElement();
    };
    var toggleElement = function () {
        if (parameters.changes.length === 0) {
            return;
        }
        isClosed = !isClosed;
        historyElement.style.height = isClosed ? '0px' : '200px';
        historyElement.style.width = isClosed ? '0px' : '500px';
        historyElement.style.opacity = isClosed ? '0' : '1';
        if (isClosed) {
            document.removeEventListener('mousedown', documentClickHandler);
        }
        else {
            document.addEventListener('mousedown', documentClickHandler);
        }
    };
    openButton.addEventListener('click', toggleElement);
    closeButton.addEventListener('click', toggleElement);
    commentsButton.addEventListener('click', function () {
        openComments(item);
    });
};
setToolbar({
    initToolbar: initToolbar
});
