'use strict';

var util = require('util'),
    Queue = require('../base'),
    _ = require('lodash'),
    tingodb = require('tingodb')(),
    ObjectID = tingodb.ObjectID;

function Tingo(options) {
  Queue.call(this, options);

  var defaults = {
    dbPath: require('path').join(__dirname, '../../'),
    collectionName: 'queue'
  };

  _.defaults(options, defaults);

  this.options = options;
}

util.inherits(Tingo, Queue);

_.extend(Tingo.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    this.db = new tingodb.Db(options.dbPath, {});
    // this.db.on('close', function() {
    //   self.emit('disconnect');
    // });
    this.queue = this.db.collection(options.collectionName + '.tingo');

    this.emit('connect');
    if (callback) callback(null, this);
  },

  disconnect: function (callback) {
    if (!this.db) {
      if (callback) callback(null);
      return;
    }

    this.emit('disconnect');
    this.db.close(callback || function () {});
  },

  getNewId: function(callback) {
    callback(null, new ObjectID().toString());
  },

  push: function(id, item, callback) {
    this.queue.save({ _id: id, id: id, data: item }, { safe: true }, callback);
  },

  getAll: function(callback) {
    this.queue.find().toArray(callback);
  },

  isQueued: function(id, callback) {
    this.queue.findOne({ _id: id }, function(err, res) {
      callback(err, !!res);
    });
  },

  decrement: function(id, callback) {
    var self = this;
    this.queue.findAndModify(
      { _id: id },
      { _id: 1 }, // Sort by _id ascending, but it doesn't really
                  // matter here (but the parameter is mandatory)
      { '$inc': { 'data.workers': -1 } },
      { 'new': true },
      function(err, item) {
        if(item && item.data && (!item.data.workers || item.data.workers <= 0)) {
          self.remove(id, function(err) {
            callback(err, true);
          });
        } else {
          callback(null);
        }
      }
    );
  },

  remove: function(id, callback) {
    this.queue.remove({ _id: id }, { safe: true }, callback);
  }

});

module.exports = Tingo;
