var expect = require('expect.js')
  , async = require('async')
  , queue = require('../lib/databases/inMemory');

function cleanQueue(done) {
    queue.getAll(function(err, results) {
        async.forEach(results, function(item, callback) {
            queue.remove(item.id, callback);
        }, function(err) {
            if (!err) done();
        });
    });
}

describe('Queue implementation', function() {

	describe('calling connect', function() {

		it('it should callback without an error', function(done) {

			queue.connect(function(err) {
				expect(err).not.to.be.ok();
				done();
			});

		});

	});

	describe('calling getNewId', function() {

		it('it should callback with a new Id as string', function(done) {

			queue.getNewId(function(err, id) {
				expect(err).not.to.be.ok();
				expect(id).to.be.an('string');
				done();
			});

		});

	});

	describe('having no entries', function() {

		before(function(done) {
			cleanQueue(done);
		});

		describe('calling getAll', function() {

			it('it should callback with an empty array', function(done) {

				queue.getAll(function(err, items) {
					expect(err).not.to.be.ok();
					expect(items).to.be.an('array');
					expect(items).to.have.length(0);
					done();
				});

			});

		});

		describe('calling isQueued', function(done) {

			it('it should callback with no error', function(done) {

				queue.isQueued('23', function(err) {
					expect(err).not.to.be.ok();
					done();
				});

			});

		});

		describe('calling remove', function(done) {

			it('it should callback with no error', function(done) {

				queue.remove('23', function(err) {
					expect(err).not.to.be.ok();
					done();
				});

			});

		});

		describe('calling decrement', function(done) {

			it('it should callback with no error', function(done) {

				queue.decrement('23', function(err) {
					expect(err).not.to.be.ok();
					done();
				});

			});

		});

	});

	describe('having any entries', function() {

		afterEach(function(done) {
			cleanQueue(done);
		});

		describe('calling getAll', function() {

			beforeEach(function(done) {

				queue.push('12345', {
					data: 'blablabla'
				}, function(err) {
					done();
				});

			});

			it('it should callback with an array that contains all records', function(done) {

				queue.getAll(function(err, items) {
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

				queue.push('12345', {
					data: 'blablabla'
				}, function(err) {
					done();
				});

			});

			describe('with an id already pushed', function() {

				it('it should callback with an error', function(done) {

					queue.isQueued('12345', function(err) {
						expect(err).to.be.ok();
						done();
					});

				});

			});

			describe('with an id not yet pushed', function() {

				it('it should callback with no error', function(done) {

					queue.isQueued('23456', function(err) {
						expect(err).not.to.be.ok();
						done();
					});

				});

			});

		});

		describe('calling remove', function(done) {

			beforeEach(function(done) {

				queue.push('12345', {
					data: 'blablabla'
				}, function(err) {
					done();
				});

			});

			describe('with an id already pushed', function() {

				it('it should remove the appropriate record', function(done) {

					queue.remove('12345', function(err) {
						expect(err).not.to.be.ok();
						queue.getAll(function(err, items) {
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

					queue.remove('23456', function(err) {
						expect(err).not.to.be.ok();
						done();
					});

				});

			});

		});

		describe('calling decrement', function() {

			describe('when pushed object has not a workers property', function() {

				beforeEach(function(done) {

					queue.push('12345', {
						data: 'blablabla'
					}, function(err) {
						done();
					});

				});

				it('it should remove the appropriate record', function(done) {

					queue.decrement('12345', function(err) {
						expect(err).not.to.be.ok();
						queue.getAll(function(err, items) {
							expect(items).to.be.an('array');
							expect(items).to.have.length(0);
							done();
						});
					});

				});

				it('it should callback with a flag', function(done) {

					queue.decrement('12345', function(err, removed) {
						expect(removed).to.be.ok();
						done();
					});

				});

			});

			describe('when pushed object has a workers property', function() {

				beforeEach(function(done) {
					queue.push('0815', {
						data: 'blimblim',
						workers: 2
					}, function(err) {
						done();
					});
				});

				it('it should decrement workers by one', function(done) {

					queue.decrement('0815', function(err) {
						expect(err).not.to.be.ok();
						queue.getAll(function(err, items) {
							expect(items).to.be.an('array');
							expect(items).to.have.length(1);
							expect(items[0].data).to.have.property('workers', 1);
							done();
						});
					});

				});

				describe('when there is only one worker left', function() {

					beforeEach(function(done) {
						queue.decrement('0815', done);
					});

					it('it should remove the appropriate record', function(done) {

						queue.decrement('0815', function(err) {
							expect(err).not.to.be.ok();
							queue.getAll(function(err, items) {
								expect(items).to.be.an('array');
								expect(items).to.have.length(0);
								done();
							});
						});

					});

					it('it should callback with a flag', function(done) {

						queue.decrement('0815', function(err, removed) {
							expect(removed).to.be.ok();
							done();
						});

					});

				});

			});

		});

	});

});