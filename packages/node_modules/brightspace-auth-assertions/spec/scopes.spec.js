/* global describe, it */

'use strict';

const expect = require('chai').expect;

const AssertionCompiler = require('../');

describe('scope assertions', function () {
	it('should match explicitly', function (done) {
		const assertion = new AssertionCompiler()
			.scope('valence', 'apps', 'manage').require()
			.compile();

		function makeAssertion () {
			assertion({
				scope: 'https://api.brightspace.com/auth/valence:apps:manage'
			});
		}

		expect(makeAssertion).to.not.throw();
		done();
	});

	it('should respect wildcards', function (done) {
		const assertion = new AssertionCompiler()
			.scope('valence', 'apps', 'manage').require()
			.compile();

		function makeAssertion () {
			assertion({
				scope: 'https://api.brightspace.com/auth/*:*:*'
			});
			assertion({
				scope: 'https://api.brightspace.com/auth/valence:*:*'
			});
			assertion({
				scope: 'https://api.brightspace.com/auth/valence:apps:*'
			});
		}

		expect(makeAssertion).to.not.throw();
		done();
	});

	it('should throw when there is insufficient scope', function (done) {
		const assertion = new AssertionCompiler()
			.scope('valence', 'apps', 'manage').require()
			.compile();

		function makeAssertion () {
			assertion({
				scope: 'https://api.brightspace.com/auth/foo:bar:baz'
			});
		}

		expect(makeAssertion).to.throw(/insufficient scope/i);
		done();
	});
});
