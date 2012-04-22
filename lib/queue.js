//     lib/queue.js v0.0.1
//     (c) 2012 Adriano Raiano (adrai); under MIT License

var fs = require('fs')
  , _ = require('underscore');

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

        fs.exists(dbPath, function (exists) {

            if (!exists) return callback('Implementation for db "' + options.type + '"" does not exist!');

            try {
                var db = require(dbPath);
                db.connect(options, callback);
            } catch (err) {
                if (err.code === 'MODULE_NOT_FOUND' && err.message.indexOf("'") > 0 && err.message.lastIndexOf("'") !== err.message.indexOf("'")) {
                    var moduleName = err.message.substring(err.message.indexOf("'") + 1, err.message.lastIndexOf("'"))
                    console.log('Please install "' + moduleName + '" to work with db implementation "' + options.type + '"!');
                }

                throw err;
            }

        });

    }

};
