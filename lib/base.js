'use strict';

var util = require('util'),
    EventEmitter = require('events').EventEmitter,
    _ = require('lodash'),
    uuid = require('node-uuid').v4;

/**
 * Queue constructor
 * @param {Object} options The options can have information like host, port, etc. [optional]
 */
function Queue(options) {
  options = options || {};

  EventEmitter.call(this);
}

util.inherits(Queue, EventEmitter);

function implementError (callback) {
  var err = new Error('Please implement this function!');
  if (callback) callback(err);
  throw err;
}

_.extend(Queue.prototype, {

  /**
   * Initiate communication with the queue.
   * @param  {Function} callback The function, that will be called when the this action is completed. [optional]
   *                             `function(err, queue){}`
   */
  connect: implementError,

  /**
   * Terminate communication with the queue.
   * @param  {Function} callback The function, that will be called when the this action is completed. [optional]
   *                             `function(err){}`
   */
  disconnect: implementError,

  /**
   * Use this function to obtain a new id.
   * @param  {Function} callback The function, that will be called when the this action is completed.
   *                             `function(err, id){}` id is of type String.
   */
  getNewId: function (callback) {
    var id = uuid().toString();
    if (callback) callback(null, id);
  },
  
  /**
   * Use this function to push something in the queue.
   * @param  {String}   id       The id for this item.
   * @param  {Object}   item     The item, that should be pushed to the queue.
   * @param  {Function} callback The function, that will be called when the this action is completed. [optional]
   *                             `function(err){}`
   */
  push: function (id, item, callback) {
    implementError(callback);
  },

  /**
   * Use this function to get get all the items from the queue.
   * @param  {Function} callback The function, that will be called when the this action is completed.
   *                             `function(err, items){}` items is of type Array.
   */
  getAll: implementError,

  /**
   * Use this function to check if an item with this id is already queued.
   * @param  {String}   id       The id for that item.
   * @param  {Function} callback The function, that will be called when the this action is completed.
   *                             `function(err, isQueued){}` isQueued is of type Boolean.
   */
  isQueued: function (id, callback) {
    implementError(callback);
  },

  /**
   * Use this function to decrement the workers property in an item in the queue.
   * @param  {String}   id       The id for that item.
   * @param  {Function} callback The function, that will be called when the this action is completed.
   *                             `function(err, hasBeenRemoved){}` hasBeenRemoved is of type Boolean. If hasBeenRemoved the item has been removed.
   */
  decrement: function (id, callback) {
    implementError(callback);
  },

  /**
   * Use this function to dequeue an item.
   * @param  {String}   id       The id for that item.
   * @param  {Function} callback The function, that will be called when the this action is completed.
   *                             `function(err){}`
   */
  remove: function (id, callback) {
    implementError(callback);
  }

});

module.exports = Queue;
