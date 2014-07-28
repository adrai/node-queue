'use strict';

var tolerate = require('tolerance'),
    Base = require('./base');

function getSpecificQueue(options) {
  options = options || {};

  if (options.prototype instanceof Base) {
    return options;
  }

  options.type = options.type || 'inmemory';

  options.type = options.type.toLowerCase();
  
  var dbPath = __dirname + "/databases/" + options.type + ".js";

  var exists = require('fs').existsSync || require('path').existsSync;
  if (!exists(dbPath)) {
    var errMsg = 'Implementation for db "' + options.type + '" does not exist!';
    console.log(errMsg);
    throw new Error(errMsg);
  }

  try {
    var db = require(dbPath);
    return db;
  } catch (err) {

    if (err.message.indexOf('Cannot find module') >= 0 &&
        err.message.indexOf("'") > 0 &&
        err.message.lastIndexOf("'") !== err.message.indexOf("'")) {

      var moduleName = err.message.substring(err.message.indexOf("'") + 1, err.message.lastIndexOf("'"));
      console.log('Please install module "' + moduleName +
                  '" to work with db implementation "' + options.type + '"!');
    }

    throw err;
  }
}

module.exports = {
  Queue: Base,

  createQueue: function(options, callback) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    }
    
    options = options || {};

    var Queue;

    try {
      Queue = getSpecificQueue(options);
    } catch (err) {
      if (callback) callback(err);
      throw err;
    }

    var queue = new Queue(options);
    process.nextTick(function() {
      tolerate(function(callback) {
        queue.connect(callback);
      }, options.timeout || 0, callback || function () {});
    });
    return queue;
  }
};
