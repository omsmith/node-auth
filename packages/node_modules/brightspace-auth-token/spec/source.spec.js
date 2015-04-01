/* global describe, it */

'use strict';

const expect = require('chai').expect;

const BrightspaceAuthToken = require('../');

describe('Source', function () {
	it('should expose source string as $source', function () {
		expect(new BrightspaceAuthToken({}, 'x.y.z').source).to.equal('x.y.z');
		expect(new BrightspaceAuthToken({}, 'foo.bar.baz').source).to.equal('foo.bar.baz');
	});
});
