'use strict';

var util = require('util'),
    Queue = require('../base'),
    _ = require('lodash'),
    cradle = require('cradle');

function Couch(options) {
  Queue.call(this, options);

  var defaults = {
    host: 'http://localhost',
    port: 5984,
    dbName: 'queuedb',
    collectionName: 'queue'
  };

  _.defaults(options, defaults);

  var defaultOpt = {
    cache: true,
    raw: false,
    forceSave: true//,
    // secure: true,
    // auth: { username: 'login', password: 'pwd' }
  };

  options.options = options.options || {};

  _.defaults(options.options, defaultOpt);

  this.options = options;

  this.collectionName = options.collectionName;
}

util.inherits(Couch, Queue);

_.extend(Couch.prototype, {

  connect: function (callback) {
    var self = this;

    var options = this.options;

    var client = new (cradle.Connection)(options.host, options.port, options.options);
    var db = client.database(options.dbName);
    db.exists(function (err, exists) {

      function finish() {
        self.client = client;
        self.db = db;

        db.get('_design/queue', function (err, obj) {

          var view = {
            views: {
              findAll: {
                map: function (doc) {
                  emit(doc.collectionName, doc);
                }
              }
            }
          };

          if (err && err.error === 'not_found') {
            db.save('_design/queue', view, function (err) {
              if (!err) {
                self.emit('connect');
              }
              if (callback) callback(err);
            });
            return;
          }
          if (!err) {
            self.emit('connect');
          }
          if (callback) callback(err, self);
        });
      }

      if (err) {
        if (callback) callback(err);
        return;
      }

      if (!exists) {
        db.create(function (err) {
          if (err) {
            if (callback) callback(err);
            return;
          }
          finish();
        });
        return;
      }

      finish();
    });
  },

  disconnect: function(callback) {
    if (!this.client) {
      if (callback) callback(null);
      return;
    }

    // this.client.close();
    this.emit('disconnect');
    if (callback) callback(null);
  },

  getNewId: function(callback) {
    this.client.uuids(function(err, uuids) {
      if (err) {
        return callback(err);
      }
      callback(null, uuids[0].toString());
    });
  },

  push: function(id, item, callback) {
    this.db.save(id, { _id: id, id: id, data: item, collectionName: this.collectionName }, callback);
  },

  getAll: function(callback) {
    this.db.view('queue/findAll', { key: this.collectionName }, function (err, docs) {
      var res = [];

      for (var i = 0, len = docs.length; i < len; i++) {
        var obj = docs[i].value;
        obj.id = obj._id;
        var found = _.find(res, function (r) {
          return r.id === obj.id;
        });

        if (!found) {
          res.push(obj);
        }
      }

      if (callback) callback(err, res);
    });
  },

  isQueued: function(id, callback) {
    this.db.get(id, function(err, res) {
      if (err && err.error === 'not_found') {
        err = null;
      }
      callback(err, !!res);
    });
  },

  decrement: function(id, callback) {
    var self = this;

    this.db.get(id, function(err, item) {
      if (item && item.data) {
        --item.data.workers;
        if((!item.data.workers || item.data.workers <= 0)) {
          self.remove(id, function(err) {
            callback(err, true);
          });
        } else {
          self.db.save(id, item, callback);
        }
        return;
      }
      callback(null);
    });
  },

  remove: function(id, callback) {
    var self = this;
    this.db.get(id, function(err, doc){
      if (doc) {
        self.db.remove(id, doc._rev, callback);
        return;
      }
      callback(null);
    });
  }

});

module.exports = Couch;




