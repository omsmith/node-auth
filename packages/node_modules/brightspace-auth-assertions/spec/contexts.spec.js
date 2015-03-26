/* global describe, it */

'use strict';

const
	AuthToken = require('@d2l/brightspace-auth-token'),
	expect = require('chai').expect;

const AssertionCompiler = require('../');

describe('context assertions', function () {
	describe('user', function () {
		it('should pass when there is a user and a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.User).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({
					sub: '169',
					tenantid: 'foozleberries'
				});

				assertion(token);
			}

			expect(makeAssertion).to.not.throw();
			done();
		});

		it('should throw when there is only a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.User).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({
					tenantid: 'foozleberries'
				});

				assertion(token);
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});

		it('should throw when there is no user or tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.User).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({});

				assertion(token);
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});
	});

	describe('tenant', function () {
		it('should throw when there is a user and a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.Tenant).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({
					sub: '169',
					tenantid: 'foozleberries'
				});

				assertion(token);
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});

		it('should pass when there is only a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.Tenant).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({
					tenantid: 'foozleberries'
				});

				assertion(token);
			}

			expect(makeAssertion).to.not.throw();
			done();
		});

		it('should throw when there is no user or tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.Tenant).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({});

				assertion(token);
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});
	});

	describe('global', function () {
		it('should throw when there is a user and a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.Global).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({
					sub: '169',
					tenantid: 'foozleberries'
				});

				assertion(token);
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});

		it('should throw when there is only a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.Global).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({
					tenantid: 'foozleberries'
				});

				assertion(token);
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});

		it('should pass when there is no user or tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.Global).require()
				.compile();

			function makeAssertion () {
				const token = new AuthToken({});

				assertion(token);
			}

			expect(makeAssertion).to.not.throw();
			done();
		});
	});
});
