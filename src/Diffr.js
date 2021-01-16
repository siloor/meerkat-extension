// https://github.com/soxhub/htmldiff.js

var Match, calculate_operations, consecutive_where, create_index, diff, find_match, find_matching_blocks, html_to_tokens, is_end_of_tag, is_start_of_tag, is_tag, img_tag, is_tag_except_img, is_whitespace, isnt_tag, op_map, recursively_find_matching_blocks, render_operations, wrap;

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

/**
 text diff based on john resig's diff.js
 @todo: refactor both of these
 **/

var textdiff = {
  escape: function(s) {
    var n = s;
    n = n.replace(/&/g, "&amp;");
    n = n.replace(/</g, "&lt;");
    n = n.replace(/>/g, "&gt;");
    n = n.replace(/"/g, "&quot;");

    return n;
  },
  diffString: function( o, n ) {
    o = o.replace(/\s+$/, '');
    n = n.replace(/\s+$/, '');

    var out = this.diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );
    var str = "";

    var oSpace = o.match(/\s+/g);
    if (oSpace == null) {
      oSpace = ["\n"];
    } else {
      oSpace.push("\n");
    }
    var nSpace = n.match(/\s+/g);
    if (nSpace == null) {
      nSpace = ["\n"];
    } else {
      nSpace.push("\n");
    }

    if (out.n.length == 0) {
      for (var i = 0; i < out.o.length; i++) {
        str += '<del>' + this.escape(out.o[i]) + oSpace[i] + "</del>";
      }
    } else {
      if (out.n[0].text == null) {
        for (n = 0; n < out.o.length && out.o[n].text == null; n++) {
          str += '<del>' + this.escape(out.o[n]) + oSpace[n] + "</del>";
        }
      }

      for ( var i = 0; i < out.n.length; i++ ) {
        if (out.n[i].text == null) {
          str += '<ins>' + this.escape(out.n[i]) + nSpace[i] + "</ins>";
        } else {
          var pre = "";

          for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text == null; n++ ) {
            pre += '<del>' + this.escape(out.o[n]) + oSpace[n] + "</del>";
          }
          str += " " + out.n[i].text + nSpace[i] + pre;
        }
      }
    }

    return str;
  },

  randomColor: function() {
    return "rgb(" + (Math.random() * 100) + "%, " +
      (Math.random() * 100) + "%, " +
      (Math.random() * 100) + "%)";
  },

  diffString2: function( o, n ) {
    o = o.replace(/\s+$/, '');
    n = n.replace(/\s+$/, '');

    var out = this.diff(o == "" ? [] : o.split(/\s+/), n == "" ? [] : n.split(/\s+/) );

    var oSpace = o.match(/\s+/g);
    if (oSpace == null) {
      oSpace = ["\n"];
    } else {
      oSpace.push("\n");
    }
    var nSpace = n.match(/\s+/g);
    if (nSpace == null) {
      nSpace = ["\n"];
    } else {
      nSpace.push("\n");
    }

    var os = "";
    var colors = new Array();
    for (var i = 0; i < out.o.length; i++) {
      colors[i] = this.randomColor();

      if (out.o[i].text != null) {
        os += '<span style="background-color: ' +colors[i]+ '">' +
          this.escape(out.o[i].text) + oSpace[i] + "</span>";
      } else {
        os += "<del>" + this.escape(out.o[i]) + oSpace[i] + "</del>";
      }
    }

    var ns = "";
    for (var i = 0; i < out.n.length; i++) {
      if (out.n[i].text != null) {
        ns += '<span style="background-color: ' +colors[out.n[i].row]+ '">' +
          this.escape(out.n[i].text) + nSpace[i] + "</span>";
      } else {
        ns += "<ins>" + this.escape(out.n[i]) + nSpace[i] + "</ins>";
      }
    }

    return { o : os , n : ns };
  },

  diff: function( o, n ) {
    var ns = new Object();
    var os = new Object();

    for ( var i = 0; i < n.length; i++ ) {
      if ( ns[ n[i] ] == null )
        ns[ n[i] ] = { rows: new Array(), o: null };
      ns[ n[i] ].rows.push( i );
    }

    for ( var i = 0; i < o.length; i++ ) {
      if ( os[ o[i] ] == null )
        os[ o[i] ] = { rows: new Array(), n: null };
      os[ o[i] ].rows.push( i );
    }

    for ( var i in ns ) {
      if ( ns[i].rows.length == 1 && typeof(os[i]) != "undefined" && os[i].rows.length == 1 ) {
        n[ ns[i].rows[0] ] = { text: n[ ns[i].rows[0] ], row: os[i].rows[0] };
        o[ os[i].rows[0] ] = { text: o[ os[i].rows[0] ], row: ns[i].rows[0] };
      }
    }

    for ( var i = 0; i < n.length - 1; i++ ) {
      if ( n[i].text != null && n[i+1].text == null && n[i].row + 1 < o.length && o[ n[i].row + 1 ].text == null &&
        n[i+1] == o[ n[i].row + 1 ] ) {
        n[i+1] = { text: n[i+1], row: n[i].row + 1 };
        o[n[i].row+1] = { text: o[n[i].row+1], row: i + 1 };
      }
    }

    for ( var i = n.length - 1; i > 0; i-- ) {
      if ( n[i].text != null && n[i-1].text == null && n[i].row > 0 && o[ n[i].row - 1 ].text == null &&
        n[i-1] == o[ n[i].row - 1 ] ) {
        n[i-1] = { text: n[i-1], row: n[i].row - 1 };
        o[n[i].row-1] = { text: o[n[i].row-1], row: i - 1 };
      }
    }

    return { o: o, n: n };
  }
};

// htmldiff is the primary function
export const diffHTML = diff;

export const diffText = textdiff.diffString;
