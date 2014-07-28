var expect = require('expect.js'),
    async = require('async'),
    queue = require('../lib/queue'),
    Base = require('../lib/base'),
    InMemory = require('../lib/databases/inmemory');

function cleanQueue(q, done) {
  q.getAll(function(err, results) {
    async.forEach(results, function(item, callback) {
      q.remove(item.id, callback);
    }, function(err) {
      if (!err) done();
    });
  });
}

describe('Queue', function() {

  it('it should have the correct interface', function() {

    expect(queue).to.be.an('object');
    expect(queue.createQueue).to.be.a('function');
    expect(queue.Queue).to.eql(Base);

  });

  describe('calling createQueue', function() {

    describe('without options', function() {

      it('it should return with the in memory queue', function() {

        var q = queue.createQueue();
        expect(q).to.be.a('object');

      });

      describe('but with a callback', function() {

        it('it should callback with queue object', function(done) {

          queue.createQueue(function(err, q) {
            expect(err).not.to.be.ok();
            expect(q).to.be.a('object');
            done();
          });

        });

      });

    });

    describe('with options of a non existing db implementation', function() {

      it('it should throw an error', function() {

        expect(function() {
          queue.createQueue({ type: 'strangeDb' });
        }).to.throwError();

      });

      it('it should callback with an error', function(done) {

        expect(function() {
          queue.createQueue({ type: 'strangeDb' }, function(err) {
            expect(err).to.be.ok();
            done();
          });
        }).to.throwError();

      });
      
    });

    describe('with options of an own db implementation', function() {

      it('it should return with the an instance of that implementation', function() {

        var q = queue.createQueue(InMemory);
        expect(q).to.be.a(InMemory);

      });
      
    });

    describe('with options containing a type property with the value of', function() {

      var types = ['inmemory', 'mongodb', 'tingodb', 'redis', 'couchdb'];

      types.forEach(function(type) {

        describe('"' + type + '"', function() {

          var q;

          describe('without callback', function() {

            afterEach(function(done) {
              q.disconnect(done);
            });

            it('it should emit connect', function(done) {

              q = queue.createQueue({ type: type });
              q.once('connect', done);

            });
          
            it('it should return with the correct queue', function() {

              q = queue.createQueue({ type: type });
              expect(q).to.be.a('object');
              expect(q.connect).to.be.a('function');
              expect(q.disconnect).to.be.a('function');
              expect(q.getNewId).to.be.a('function');
              expect(q.push).to.be.a('function');
              expect(q.getAll).to.be.a('function');
              expect(q.isQueued).to.be.a('function');
              expect(q.decrement).to.be.a('function');
              expect(q.remove).to.be.a('function');

            });

          });

          describe('with callback', function() {

            afterEach(function(done) {
              q.disconnect(done);
            });
          
            it('it should return with the correct queue', function(done) {

              queue.createQueue({ type: type }, function(err, resQ) {
                q = resQ;
                expect(resQ).to.be.a('object');
                done();
              });

            });

          });

          describe('having connected', function() {
          
            describe('calling disconnect', function() {

              beforeEach(function(done) {
                queue.createQueue({ type: type }, function(err, resQ) {
                  q = resQ;
                  done();
                });
              });

              it('it should callback successfully', function(done) {

                q.disconnect(function(err) {
                  expect(err).not.to.be.ok();
                  done();
                });

              });

              it('it should emit disconnect', function(done) {

                q.once('disconnect', done);
                q.disconnect();
                
              });

            });

            describe('using the queue', function() {

              before(function(done) {
                queue.createQueue({ type: type }, function(err, resQ) {
                  q = resQ;
                  done();
                });
              });

              describe('calling getNewId', function() {

                it('it should callback with a new Id as string', function(done) {

                  q.getNewId(function(err, id) {
                    expect(err).not.to.be.ok();
                    expect(id).to.be.a('string');
                    done();
                  });

                });

              });

              describe('having no entries', function() {

                before(function(done) {
                  cleanQueue(q, done);
                });

                describe('calling getAll', function() {

                  it('it should callback with an empty array', function(done) {

                    q.getAll(function(err, items) {
                      expect(err).not.to.be.ok();
                      expect(items).to.be.an('array');
                      expect(items).to.have.length(0);
                      done();
                    });

                  });

                });

                describe('calling isQueued', function(done) {

                  it('it should callback correctly', function(done) {

                    q.isQueued('23', function(err, isQueued) {
                      expect(err).not.to.be.ok();
                      expect(isQueued).to.eql(false);
                      done();
                    });

                  });

                });

                describe('calling remove', function(done) {

                  it('it should callback with no error', function(done) {

                    q.remove('23', function(err) {
                      expect(err).not.to.be.ok();
                      done();
                    });

                  });

                });

                describe('calling decrement', function(done) {

                  it('it should callback with no error', function(done) {

                    q.decrement('23', function(err) {
                      expect(err).not.to.be.ok();
                      done();
                    });

                  });

                });

              });

              describe('having any entries', function() {

                afterEach(function(done) {
                  cleanQueue(q, done);
                });

                describe('calling getAll', function() {

                  beforeEach(function(done) {

                    q.push('12345', {
                      data: 'blablabla'
                    }, done);

                  });

                  it('it should callback with an array that contains all records', function(done) {

                    q.getAll(function(err, items) {
                      expect(err).not.to.be.ok();
                      expect(items).to.be.an('array');
                      expect(items).to.have.length(1);
                      expect(items[0].data).to.have.property('data', 'blablabla');
                      done();
                    });

                  });

                });

                describe('calling isQueued', function(done) {

                  beforeEach(function(done) {

                    q.push('12345', {
                      data: 'blablabla'
                    }, done);

                  });

                  describe('with an id already pushed', function() {

                    it('it should callback with an error', function(done) {

                      q.isQueued('12345', function(err, isQueued) {
                        expect(err).not.to.be.ok();
                        expect(isQueued).to.eql(true);
                        done();
                      });

                    });

                  });

                  describe('with an id not yet pushed', function() {

                    it('it should callback with no error', function(done) {

                      q.isQueued('23456', function(err, isQueued) {
                        expect(err).not.to.be.ok();
                        expect(isQueued).to.eql(false);
                        done();
                      });

                    });

                  });

                });

                describe('calling remove', function(done) {

                  beforeEach(function(done) {

                    q.push('12345', {
                      data: 'blablabla'
                    }, done);

                  });

                  describe('with an id already pushed', function() {

                    it('it should remove the appropriate record', function(done) {

                      q.remove('12345', function(err) {
                        expect(err).not.to.be.ok();
                        q.getAll(function(err, items) {
                          expect(err).not.to.be.ok();
                          expect(items).to.be.an('array');
                          expect(items).to.have.length(0);
                          done();
                        });
                      });

                    });

                  });

                  describe('with an id not yet pushed', function() {

                    it('it should callback with no error', function(done) {

                      q.remove('23456', function(err) {
                        expect(err).not.to.be.ok();
                        done();
                      });

                    });

                  });

                });

                describe('calling decrement', function() {

                  describe('when pushed object has not a workers property', function() {

                    beforeEach(function(done) {

                      q.push('12345', {
                        data: 'blablabla'
                      }, done);

                    });

                    it('it should remove the appropriate record', function(done) {

                      q.decrement('12345', function(err) {
                        expect(err).not.to.be.ok();
                        q.getAll(function(err, items) {
                          expect(items).to.be.an('array');
                          expect(items).to.have.length(0);
                          done();
                        });
                      });

                    });

                    it('it should callback with a flag', function(done) {

                      q.decrement('12345', function(err, removed) {
                        expect(removed).to.be.ok();
                        done();
                      });

                    });

                  });

                  describe('when pushed object has a workers property', function() {

                    beforeEach(function(done) {
                      q.push('0815', {
                        data: 'blimblim',
                        workers: 2
                      }, done);
                    });

                    it('it should decrement workers by one', function(done) {

                      q.decrement('0815', function(err) {
                        expect(err).not.to.be.ok();
                        q.getAll(function(err, items) {
                          expect(items).to.be.an('array');
                          expect(items).to.have.length(1);
                          expect(items[0].data).to.have.property('workers', 1);
                          done();
                        });
                      });

                    });

                    describe('when there is only one worker left', function() {

                      beforeEach(function(done) {
                        q.decrement('0815', done);
                      });

                      it('it should remove the appropriate record', function(done) {

                        q.decrement('0815', function(err) {
                          expect(err).not.to.be.ok();
                          q.getAll(function(err, items) {
                            expect(items).to.be.an('array');
                            expect(items).to.have.length(0);
                            done();
                          });
                        });

                      });

                      it('it should callback with a flag', function(done) {

                        q.decrement('0815', function(err, removed) {
                          expect(removed).to.be.ok();
                          done();
                        });

                      });

                    });

                  });

                });

              });

            });

          });

        });
      });

    });

  });

});