'use strict';

var util = require('util'),
    Queue = require('../base'),
    _ = require('lodash'),
    store = {};

function InMemory(options) {
  Queue.call(this, options);
}

util.inherits(InMemory, Queue);

_.extend(InMemory.prototype, {

  connect: function (callback) {
    this.emit('connect');
    if (callback) callback(null, this);
  },

  disconnect: function (callback) {
    this.emit('disconnect');
    if (callback) callback(null);
  },

  push: function(id, item, callback) {
    store[id] = item;
    if (callback) callback(null);
  },

  getAll: function(callback) {
    var items = [];
    for(var m in store) {
      items.push({ id: m, data: store[m] });
    }

    if (callback) callback(null, items);
  },

  isQueued: function(id, callback) {
    if (callback) callback(null, !!store[id]);
  },

  decrement: function(id, callback) {
    if (store[id]) {
      if (!store[id].workers) {
        return this.remove(id, function(err) {
          callback(err, true);
        });
      }

      store[id].workers--;
      if (store[id].workers <= 0) {
        return this.remove(id, function(err) {
          callback(err, true);
        });
      }
    }
    
    if (callback) callback(null);
  },

  remove: function(id, callback) {
    if (store[id] !== undefined) delete store[id];
    if (callback) callback(null);
  }

});

module.exports = InMemory;
