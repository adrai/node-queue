'use strict';

var util = require('util'),
    Queue = require('../base'),
    _ = require('lodash'),
    mongo = require('mongodb'),
    ObjectID = mongo.BSONPure.ObjectID;

function Mongo(options) {
  Queue.call(this, options);

  var defaults = {
    host: 'localhost',
    port: 27017,
    dbName: 'queuedb',
    collectionName: 'queue'
  };

  _.defaults(options, defaults);

  var defaultOpt = {
    auto_reconnect: false,
    ssl: false
  };

  options.options = options.options || {};

  _.defaults(options.options, defaultOpt);

  this.options = options;
}

util.inherits(Mongo, Queue);

_.extend(Mongo.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    var server;

    if (options.servers && Array.isArray(options.servers)){
      var servers = [];

      options.servers.forEach(function(item){
        if(item.host && item.port) {
          servers.push(new mongo.Server(item.host, item.port, item.options));
        }
      });

      server = new mongo.ReplSetServers(servers);
    } else {
      server = new mongo.Server(options.host, options.port, options.options);
    }

    this.db = new mongo.Db(options.dbName, server, { safe: true });
    this.db.on('close', function() {
      self.emit('disconnect');
    });

    this.db.open(function (err, client) {
      if (err) {
        if (callback) callback(err);
      } else {
        var finish = function (err) {
          self.client = client;
          self.queue = new mongo.Collection(client, options.collectionName);
          // self.queue.ensureIndex({ 'id': 1 }, function() {});
          if (!err) {
            self.emit('connect');
          }
          if (callback) callback(err, self);
        };

        if (options.username) {
          client.authenticate(options.username, options.password, finish);
        } else {
          finish();
        }
      }
    });
  },

  disconnect: function (callback) {
    if (!this.db) {
      if (callback) callback(null);
      return;
    }

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

module.exports = Mongo;

