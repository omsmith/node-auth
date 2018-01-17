/* global describe, it */

'use strict';

const expect = require('chai').expect;

const BrightspaceAuthToken = require('../');

describe('constructor', function() {
	it('should throw when "decodedPayload" is not an Object', function() {
		function makeToken() {
			new BrightspaceAuthToken('not-object', 'string');
		}

		expect(makeToken).to.throw(/Object/);
	});

	it('should throw when "source" is not a String', function() {
		function makeToken() {
			new BrightspaceAuthToken({}, { not: 'string' });
		}

		expect(makeToken).to.throw(/String/);
	});

	it('should return instance when arguments are valid', function() {
		const token = new BrightspaceAuthToken({}, 'string');
		expect(token).to.be.an.instanceof(BrightspaceAuthToken);
	});
});
