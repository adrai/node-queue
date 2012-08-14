var cradle = require('cradle')
  , _ = require('lodash');

module.exports = {

    // __connect:__ Initiate communication with the database.
    // 
    // `db.connect(options, callback)`
    //
    // - __options:__ The options can have information like host, port, etc. [optional]
    // - __callback:__ `function(err, queue){}`
    connect: function(options, callback) {

        if(_.isFunction(options)) {
            callback = options;
        }

        var defaults = {
            host: 'http://localhost',
            port: 5984,
            dbName: 'queuedb',
            collectionName: 'queue'
        };
        
        _.defaults(options, defaults);

        var defaultOpt = {
            cache: true,
            raw: false//,
            // secure: true,
            // auth: { username: 'login', password: 'pwd' }
        };

        options.options = options.options || {};

        _.defaults(options.options, defaultOpt);

        this.collectionName = options.collectionName;

        if (this.isConnected) {
            if (callback) { return callback(null, this); }
            return;
        }

        this.isConnected = false;
        var self = this;

        var client = new(cradle.Connection)(options.host, options.port, options.options);
        var db = client.database(options.dbName);
        db.exists(function (err, exists) {

            function finish() {
                self.client = client;
                self.db = db;
                self.isConnected = true;

                db.get('_design/collection', function(err, obj) {

                    var view = {
                        views: {
                            findAll: {
                                map: function(doc) {
                                    emit(doc.collectionName, doc);
                                }
                            }
                        }
                    };

                    if (err && err.error == 'not_found') {
                        db.save('_design/collection', view, function(err) {
                            if (callback) { return callback(null, self); }
                        });
                    } else if (err) {
                       if (callback) { return callback(err, self); }
                    } else {
                        db.save('_design/collection', obj._rev, view, function(err) {
                            if (callback) { return callback(null, self); }
                        });
                    }

                });
            }

            if (err) {
                if (callback) { return callback(err); }
            } else if (!exists) {
                db.create(function(err) {
                    finish();
                });
            } else {
                finish();
            }    
        });

    },

    // __push:__ Use this function to push something in the queue.
    // 
    // `queue.push(id, item, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __item:__ The item that have to queued.
    // - __callback:__ `function(err){}`
    push: function(id, item, callback) {
        this.db.save(id, { _id: id, id: id, data: item, collectionName: this.collectionName }, callback);
    },

    // __getAll:__ Use this function to get get all the items from the queue.
    // 
    // `queue.getAll(callback)`
    //
    // - __callback:__ `function(err, items){}`
    getAll: function(callback) {
        this.db.view('collection/findAll', { key: this.collectionName }, function(err, docs) {
            var res = [];

            for(var i = 0, len = docs.length; i < len; i++){
                var obj = docs[i].value;
                obj.id = obj._id;
                var found = _.find(res, function(r) {
                    return r.id === obj.id;
                });

                if (!found) {
                    res.push(obj);
                }
            }

            callback(err, res);

        });
    },

    // __getAll:__ Use this function to check if an item with this id is already queued.
    // 
    // `queue.isQueued(id, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __callback:__ `function(err){}`
    isQueued: function(id, callback) {

        this.db.get(id, function(err, res) {
            callback(res ? new Error() : null);
        });

    },

    // __decrement:__ Use this function to decrement the workers property in an item in the queue.
    // 
    // `queue.decrement(id, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __callback:__ `function(err){}`
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
            } else {
                callback(null);
            }
        });
    },

    // __remove:__ Use this function to dequeue an item.
    // 
    // `queue.remove(id, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __callback:__ `function(err){}`
    remove: function(id, callback) {
        var self = this;
        this.db.get(id, function(err, doc){
            if (doc) {
                self.db.remove(id, doc._rev, callback);
            } else {
                callback(null);
            }
        });
    },

    // __getNewId:__ Use this function to obtain a new id.
    // 
    // `queue.getNewId(callback)`
    //
    // - __callback:__ `function(err, id){}`
    getNewId: function(callback) {
        this.client.uuids(function(err, uuids) {
            if (err) {
                return callback(err);
            } else {
                callback(err, uuids[0].toString());
            }
        });
    }

};
