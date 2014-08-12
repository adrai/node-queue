# Introduction

[![travis](https://img.shields.io/travis/adrai/node-queue.svg)](https://travis-ci.org/adrai/node-queue) [![npm](https://img.shields.io/npm/v/node-queue.svg)](https://npmjs.org/package/node-queue)

Node-queue is a node.js module for multiple databases.
It can be very useful if you work with (d)ddd, cqrs, eventsourcing, commands and events, etc.

# Installation

    $ npm install node-queue

# Usage

## Connecting to an in-memory queue

	var queue = require('node-queue');

	queue.createQueue(function(err, myQueue) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        // you can now use myQueue variable to go on...
    });

## Connecting to any queue (mongodb in the example)
Make shure you have installed the required driver, in this example run: 'npm install mongodb'.

    var queue = require('node-queue');

    queue.createQueue(
        {
            type: 'mongoDb',
            host: 'localhost',      // optional
            port: 27017,            // optional
            dbName: 'queuedb',      // optional
            collectionName: 'queue' // optional
            timeout: 10000          // optional
        }, 
        function(err, myQueue) {
            if(err) {
                console.log('ohhh :-(');
                return;
            }

            // you can now use myQueue variable to go on...
        }
    );

## Pushing...

    myQueue.push('myId', { some: 'data' }, function(err) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }
    });

## Removing...

    myQueue.remove('myId',  function(err) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }
    });

## Check if is already queued

    myQueue.isQueued('myId',  function(err, isQueued) {
        if(isQueued) {
            console.log('Already queued!');
        } else {
            console.log('Not queued!');
        }
    });

## Getting all...

    myQueue.getAll(function(err, items) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        // items is an array of all what is in the queue
        var firstItem = items[0];
        console.log('the id: ' + firstItem.id);
        console.log('the pushed data: ' + firstItem.data);
    });

## Obtain a new id

    myQueue.getNewId(function(err, newId) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        console.log('the new id is: ' + newId);
    });

## Catch connect ad disconnect events

    var q = queue.createQueue({ type: 'mongodb' }, function(err, q) {
        console.log('hello from callback');
        // use queue here...
    });
    q.on('connect', function() {
        console.log('hello from event');
        // or here
    });
    q.on('disconnect', function() {
        console.log('bye');
    });

## Decrement (can be very useful if you want to create a eventQueue for eventdenormalizers, cqrs, eventsourcing)

    // if you push yout items with a workers property...
    myQueue.push('myId', { some: 'data', workers: 2 }, function(err) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

    });

    ...

    // then you can decrement the workers property
    myQueue.decrement('myId', function(err, hasBeenRemoved) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        // Now the workers value is decremented,
        // but if the workers value after the decrement is 0,
        // the record will be automatically removed.
        // You can check this with the flag hasBeenRemoved!

        if(hasBeenRemoved) {
            console.log('All workers finished!');
        }

    });

#[Release notes](https://github.com/adrai/node-queue/blob/master/releasenotes.md)

# Database Support
Currently these databases are supported:

1. inmemory
2. mongodb ([node-mongodb-native] (https://github.com/mongodb/node-mongodb-native))
3. couchdb ([cradle] (https://github.com/cloudhead/cradle))
4. tingodb ([tingodb] (https://github.com/sergeyksv/tingodb))
5. redis ([redis] (https://github.com/mranney/node_redis))

## own db implementation
You can use your own db implementation by extending this...

    var Queue = require('node-queue').Queue,
    util = require('util'),
        _ = require('lodash');

    function MyDB(options) {
      Queue.call(this, options);
    }

    util.inherits(MyDB, Queue);

    _.extend(MyDB.prototype, {

      ...

    });

    module.exports = MyDB;


# License

Copyright (c) 2014 Adriano Raiano

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.