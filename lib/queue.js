var fs = require('fs')
  , _ = require('lodash')
  , tolerate = require('tolerance');

module.exports = {

    // __connect:__ Initiate communication with the database.
    // 
    // `queue.connect(options, callback)`
    //
    // - __options:__ The options can have information like host, port, etc. [optional]
    // - __callback:__ `function(err, queue){}`
    connect: function(options, callback) {

        if(_.isFunction(options)) {
            callback = options;
            options = { type: 'inMemory' };
        }

        var dbPath = __dirname + "/databases/" + options.type + ".js";

        var exists = fs.exists || require('path').exists;
        exists(dbPath, function (exists) {

            if (!exists) return callback('Implementation for db "' + options.type + '"" does not exist!');

            try {
                var db = require(dbPath);
                tolerate(function(callback) {
                    db.connect(options, callback);
                }, options.timeout || 0, callback);
            } catch (err) {
                if (err.message.indexOf("Cannot find module") >= 0 && err.message.indexOf("'") > 0 && err.message.lastIndexOf("'") !== err.message.indexOf("'")) {
                    var moduleName = err.message.substring(err.message.indexOf("'") + 1, err.message.lastIndexOf("'"));
                    console.log('Please install "' + moduleName + '" to work with db implementation "' + options.type + '"!');
                }

                throw err;
            }

        });

    }

};
