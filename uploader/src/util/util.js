/**
 * @file picture compress && upload && watermark
 */

define(function(require, exports, module) {
  var forEach = Array.prototype.forEach;

  /**
   * helper function for extend
   *
   * @param {Object} obj clone object
   *
   * @return {Object} cloned object
   */
  var clone = function(obj) {
    var copy = {};

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key] = obj[key];
      }
    }

    return copy;
  };

  /**
   * extend target from source
   *
   * @param {Object} target target object
   * @param {Object} source source object
   * @param {booean} copy   是否复制target
   *
   * @return {Object} extend object
   */
  var extend = function(target, source, copy) {
    target = (copy ? clone(target) : target) || {};
    for (var key in source) {
      if (source.hasOwnProperty(key)) {
        target[key] = source[key];
      }
    }

    return target;
  };

  var addEvent = function(elem, type, callback) {
    elem.addEventListener(type, callback, false);
  };

  var $ = function(child, parent, all) {
    parent = parent || document.body;

    return parent['querySelector' + (all ? 'All' : '')](child);
  };

  var post = function(options) {
    options = options || {};

    var xhr = new XMLHttpRequest();

    xhr.open('POST', options.url);

    xhr.onload = function() {
      if (xhr.status === 200) {
        options.success(JSON.parse(xhr.responseText));
      }
    };

    xhr.onerror = function(e) {
      options.error(e);
    };

    // xhr.setRequestHeader('Content-type', 'multipart/form-data');

    xhr.send(options.data);
  };

  module.exports = {
    $: $,
    post: post,
    extend: extend,
    forEach: forEach,
    addEvent: addEvent
  };

});
