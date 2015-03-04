/* global describe, it */

'use strict';

const expect = require('chai').expect;

const AssertionCompiler = require('../');

describe('context assertions', function () {
	describe('user', function () {
		it('should pass when there is a user and a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.user).require()
				.compile();

			function makeAssertion () {
				assertion({
					sub: '169',
					tenantid: 'foozleberries'
				});
			}

			expect(makeAssertion).to.not.throw();
			done();
		});

		it('should throw when there is only a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.user).require()
				.compile();

			function makeAssertion () {
				assertion({
					tenantid: 'foozleberries'
				});
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});

		it('should throw when there is no user or tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.user).require()
				.compile();

			function makeAssertion () {
				assertion({});
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});
	});

	describe('tenant', function () {
		it('should throw when there is a user and a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.tenant).require()
				.compile();

			function makeAssertion () {
				assertion({
					sub: '169',
					tenantid: 'foozleberries'
				});
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});

		it('should pass when there is only a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.tenant).require()
				.compile();

			function makeAssertion () {
				assertion({
					tenantid: 'foozleberries'
				});
			}

			expect(makeAssertion).to.not.throw();
			done();
		});

		it('should throw when there is no user or tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.tenant).require()
				.compile();

			function makeAssertion () {
				assertion({});
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});
	});

	describe('global', function () {
		it('should throw when there is a user and a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.global).require()
				.compile();

			function makeAssertion () {
				assertion({
					sub: '169',
					tenantid: 'foozleberries'
				});
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});

		it('should throw when there is only a tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.global).require()
				.compile();

			function makeAssertion () {
				assertion({
					tenantid: 'foozleberries'
				});
			}

			expect(makeAssertion).to.throw(/invalid context/i);
			done();
		});

		it('should pass when there is no user or tenant', function (done) {
			const assertion = new AssertionCompiler()
				.context(AssertionCompiler.contexts.global).require()
				.compile();

			function makeAssertion () {
				assertion({});
			}

			expect(makeAssertion).to.not.throw();
			done();
		});
	});
});
