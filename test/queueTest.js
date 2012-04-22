var expect = require('expect.js')
  , queue = require('../lib/queue');

describe('Queue', function() {

	describe('calling connect', function() {

		describe('without options', function() {

			it('it should callback without an error', function(done) {

				queue.connect(function(err) {
					expect(err).not.to.be.ok();
					done();
				});

			});

		});

		describe('with options containing a type property with the value of', function() {

			describe('an existing db implementation', function() {

				it('it should callback without an error', function(done) {

					queue.connect({ type: 'inMemory' }, function(err) {
						expect(err).not.to.be.ok();
						done();
					});

				});

			});

			describe('a non existing db implementation', function() {

				it('it should callback with an error', function(done) {

					queue.connect({ type: 'strangeDb' }, function(err) {
						expect(err).to.be.ok();
						done();
					});

				});

			});

		});

	});

});