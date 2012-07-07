# Introduction

[![Build Status](https://secure.travis-ci.org/adrai/node-queue.png)](http://travis-ci.org/adrai/node-queue)

Node-queue is a node.js module for multiple databases.
It can be very useful if you work with (d)ddd, cqrs, eventsourcing, commands and events, etc.

# Installation

    $ npm install node-queue

# Usage

## Connecting to an in-memory queue

	var queue = require('node-queue');

	queue.connect(function(err, myQueue) {
        if(err) {
            console.log('ohhh :-(');
            return;
        }

        // you can now use myQueue variable to go on...
    });

## Connecting to any queue (mongodb in the example)
Make shure you have installed the required driver, in this example run: 'npm install mongodb'.

    var queue = require('node-queue');

    queue.connect(
        {
            type: 'mongoDb',
            host: 'localhost',      // optional
            port: 27017,            // optional
            dbName: 'queuedb',      // optional
            collectionName: 'queue' // optional
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

    myQueue.isQueued('myId',  function(err) {
        if(err) {
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


# Database Support
Currently these databases are supported:

1. inMemory
2. mongoDb ([node-mongodb-native] (https://github.com/mongodb/node-mongodb-native))
3. couchDb ([cradle] (https://github.com/cloudhead/cradle))

# License

Copyright (c) 2012 Adriano Raiano

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