var mongo = require('mongodb')
  , ObjectID = mongo.BSONPure.ObjectID
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
            host: 'localhost',
            port: 27017,
            dbName: 'queuedb',
            collectionName: 'queue'
        };
        
        _.defaults(options, defaults);

        var defaultOpt = {
            auto_reconnect: true,
            ssl: false
        };

        options.options = options.options || {};

        _.defaults(options.options, defaultOpt);

        var self = this;
        var server = new mongo.Server(options.host, options.port, options.options);
        new mongo.Db(options.dbName , server, { safe: true }).open(function(err, client) {
            if (err) {
                if (callback) callback(err);
            } else {
                var finish = function() {
                    self.client = client;
                    self.queue = new mongo.Collection(client, options.collectionName);
                    if (callback) callback(null, self);
                };

                if (options.username) {
                    client.authenticate(options.username, options.password, finish);
                } else {
                    finish();
                }
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
        this.queue.save({ _id: id, id: id, data: item }, { safe: true }, callback);
    },

    // __getAll:__ Use this function to get get all the items from the queue.
    // 
    // `queue.getAll(callback)`
    //
    // - __callback:__ `function(err, items){}`
    getAll: function(callback) {
        this.queue.find().toArray(callback);
    },

    // __getAll:__ Use this function to check if an item with this id is already queued.
    // 
    // `queue.isQueued(id, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __callback:__ `function(err){}`
    isQueued: function(id, callback) {
        this.queue.findOne({ _id: id }, function(err, res) {
            callback(res ? new Error() : err);
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

    // __remove:__ Use this function to dequeue an item.
    // 
    // `queue.remove(id, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __callback:__ `function(err){}`
    remove: function(id, callback) {
        this.queue.remove({ _id: id }, { safe: true }, callback);
    },

    // __getNewId:__ Use this function to obtain a new id.
    // 
    // `queue.getNewId(callback)`
    //
    // - __callback:__ `function(err, id){}`
    getNewId: function(callback) {
        callback(null, new ObjectID().toString());
    }

};
