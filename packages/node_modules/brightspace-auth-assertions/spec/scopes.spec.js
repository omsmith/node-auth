/* global describe, it */

'use strict';

const
	AuthToken = require('@d2l/brightspace-auth-token'),
	expect = require('chai').expect;

const AssertionCompiler = require('../');

describe('scope assertions', function () {
	it('should match explicitly', function (done) {
		const assertion = new AssertionCompiler()
			.scope('valence', 'apps', 'manage').require()
			.compile();

		function makeAssertion () {
			const token = new AuthToken({
				scope: 'valence:apps:manage'
			});

			assertion(token);
		}

		expect(makeAssertion).to.not.throw();
		done();
	});

	it('should respect wildcards', function (done) {
		const assertion = new AssertionCompiler()
			.scope('valence', 'apps', 'manage').require()
			.compile();

		function makeAssertion () {
			assertion(new AuthToken({
				scope: '*:*:*'
			}));
			assertion(new AuthToken({
				scope: 'valence:*:*'
			}));
			assertion(new AuthToken({
				scope: 'valence:apps:*'
			}));
		}

		expect(makeAssertion).to.not.throw();
		done();
	});

	it('should throw when there is insufficient scope', function (done) {
		const assertion = new AssertionCompiler()
			.scope('valence', 'apps', 'manage').require()
			.compile();

		function makeAssertion () {
			const token = new AuthToken({
				scope: 'foo:bar:baz'
			});

			assertion(token);
		}

		expect(makeAssertion).to.throw(/insufficient scope/i);
		done();
	});
});
