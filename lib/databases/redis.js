'use strict';

var util = require('util'),
    Queue = require('../base'),
    _ = require('lodash'),
    async = require('async'),
    redis = require('redis'),
    jsondate = require('jsondate');

function Redis(options) {
  Queue.call(this, options);

  var defaults = {
    host: 'localhost',
    port: 6379,
    prefix: 'queue',
    ttl: 804600,
    max_attempts: 1
  };

  _.defaults(options, defaults);

  if (options.url) {
    var url = require('url').parse(options.url);
    if (url.protocol === 'redis:') {
      if (url.auth) {
        var userparts = url.auth.split(":");
        options.user = userparts[0];
        if (userparts.length === 2) {
          options.password = userparts[1];
        }
      }
      options.host = url.hostname;
      options.port = url.port;
      if (url.pathname) {
        options.db   = url.pathname.replace("/", "", 1);
      }
    }
  }

  this.options = options;
}

util.inherits(Redis, Queue);

_.extend(Redis.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    this.client = new redis.createClient(options.port || options.socket, options.host, options);

    this.prefix = options.prefix;

    var calledBack = false;

    if (options.password) {
      this.client.auth(options.password, function(err) {
        if (err && !calledBack && callback) {
          calledBack = true;
          if (callback) callback(err, self);
          return;
        }
        if (err) throw err;
      });
    }

    if (options.db) {
      this.client.select(options.db);
    }

    this.client.on('end', function () {
      self.disconnect();
    });

    this.client.on('error', function (err) {
      console.log(err);

      if (calledBack) return;
      calledBack = true;
      if (callback) callback(null, self);
    });

    this.client.on('connect', function () {
      if (options.db) {
        self.client.send_anyways = true;
        self.client.select(options.db);
        self.client.send_anyways = false;
      }
      
      self.emit('connect');

      if (calledBack) return;
      calledBack = true;
      if (callback) callback(null, self);
    });
  },

  disconnect: function (callback) {
    this.client.end();
    this.emit('disconnect');
    if (callback) callback(null, this);
  },

  getNewId: function(callback) {
    this.client.incr('nextItemId:' + this.prefix, function(err, id) {
      if (err) {
        return callback(err);
      }
      callback(null, id.toString());
    });
  },

  push: function(id, item, callback) {
    var prefixedId = this.prefix + ':' + id;

    try {
      item = JSON.stringify({ data: item });
      this.client.set(prefixedId, item, callback  || function () {});
    } catch (err) {
      if (callback) callback(err);
    }
  },

  getAll: function(callback) {
    var self = this;
    this.client.keys(this.prefix + ':*', function(err, docs) {
      async.map(docs, function(doc, callback) {
        self.client.get(doc, function (err, data) {
          if (err) {
            if (callback) callback(err);
            return;
          }
          if (!data) {
            if (callback) callback(null, null);
            return;
          }

          var result;

          try {
            result = jsondate.parse(data.toString());
          } catch (error) {
            if (callback) callback(err);
            return;
          }

          if (callback) callback(null, result);
        });
      }, callback);
    });
  },

  isQueued: function(id, callback) {
    var prefixedId = this.prefix + ':' + id;

    this.client.get(prefixedId, function (err, data) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      if (callback) callback(null, !!data);
    });
  },

  decrement: function(id, callback) {
    var self = this;

    var prefixedId = this.prefix + ':' + id;

    this.client.get(prefixedId, function (err, data) {
      if (err) {
        if (callback) callback(err);
        return;
      }
      if (!data) {
        if (callback) callback(null, null);
        return;
      }

      var item;

      try {
        item = jsondate.parse(data.toString());
      } catch (error) {
        if (callback) callback(err);
        return;
      }

      if (item && item.data) {
        --item.data.workers;
        if((!item.data.workers || item.data.workers <= 0)) {
          self.remove(id, function(err) {
            callback(err, true);
          });
        } else {
          try {
            self.client.set(prefixedId, JSON.stringify(item), callback  || function () {});
          } catch (err) {
            if (callback) callback(err);
          }
        }
        return;
      }
      callback(null);
    });
  },

  remove: function(id, callback) {
    var prefixedId = this.prefix + ':' + id;
    this.client.del(prefixedId, callback || function () {});
  }

});

module.exports = Redis;

