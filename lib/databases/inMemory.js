var _ = require('lodash')
  , store = {}
  , uuid = require('../uuid');

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
        if (callback) callback(null, this);
    },

    // __push:__ Use this function to push something in the queue.
    // 
    // `queue.push(id, item, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __item:__ The item that have to queued.
    // - __callback:__ `function(err){}`
    push: function(id, item, callback) {
        store[id] = item;
        if (callback) callback(null);
    },

    // __getAll:__ Use this function to get get all the items from the queue.
    // 
    // `queue.getAll(callback)`
    //
    // - __callback:__ `function(err, items){}`
    getAll: function(callback) {
        var items = [];
        for(var m in store) {
            items.push({ id: m, data: store[m] });
        }

        if (callback) callback(null, items);
    },

    // __getAll:__ Use this function to check if an item with this id is already queued.
    // 
    // `queue.isQueued(id, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __callback:__ `function(err){}`
    isQueued: function(id, callback) {
        if (callback) callback(store[id]);
    },

    // __decrement:__ Use this function to decrement the workers property in an item in the queue.
    // 
    // `queue.decrement(id, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __callback:__ `function(err){}`
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

    // __remove:__ Use this function to dequeue an item.
    // 
    // `queue.remove(id, callback)`
    //
    // - __id:__ The id to identify the item.
    // - __callback:__ `function(err){}`
    remove: function(id, callback) {
        delete store[id];
        if (callback) callback(null);
    },

    // __getNewId:__ Use this function to obtain a new id.
    // 
    // `queue.getNewId(callback)`
    //
    // - __callback:__ `function(err, id){}`
    getNewId: function(callback) {
        if (callback) callback(null, uuid().toString());
    }

};