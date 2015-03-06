/* global before, describe, it */

'use strict';

const expect = require('chai').expect;

const
	BrightspaceAuthToken = require('../'),
	contexts = require('../src/contexts');

describe('Contexts', function () {
	it('should be available on the export as "contexts"', function () {
		expect(BrightspaceAuthToken.contexts).to.deep.equal(contexts);
	});

	describe('when "sub" is present', function () {
		let token;
		before(function () {
			token = new BrightspaceAuthToken({
				sub: '169',
				tenantid: 'foozleberries'
			});
		});

		it('$context should be the User context', function () {
			expect(token.context).to.equal(contexts.User);
		});

		it('#isUserContext should return true', function () {
			expect(token.isUserContext()).to.be.true;
		});

		it('#isTenantContext should return false', function () {
			expect(token.isTenantContext()).to.be.false;
		});

		it('#isGlobalContext should return false', function () {
			expect(token.isGlobalContext()).to.be.false;
		});
	});

	describe('when only "tenantid" is present', function () {
		let token;
		before(function () {
			token = new BrightspaceAuthToken({
				tenantid: 'foozleberries'
			});
		});

		it('$context should be the Tenant context', function () {
			expect(token.context).to.equal(contexts.Tenant);
		});

		it('#isUserContext should return false', function () {
			expect(token.isUserContext()).to.be.false;
		});

		it('#isTenantContext should return true', function () {
			expect(token.isTenantContext()).to.be.true;
		});

		it('#isGlobalContext should return false', function () {
			expect(token.isGlobalContext()).to.be.false;
		});
	});

	describe('when "sub" nor "tenantid" are present', function () {
		let token;
		before(function () {
			token = new BrightspaceAuthToken({});
		});

		it('$context should be the Global context', function () {
			expect(token.context).to.equal(contexts.Global);
		});

		it('#isUserContext should return false', function () {
			expect(token.isUserContext()).to.be.false;
		});

		it('#isTenantContext should return false', function () {
			expect(token.isTenantContext()).to.be.false;
		});

		it('#isGlobalContext should return true', function () {
			expect(token.isGlobalContext()).to.be.true;
		});
	});
});
