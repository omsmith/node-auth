'use strict';

const
	assert = require('assert'),
	base64Url = require('base64-url'),
	parseAsn1 = require('parse-asn1');

function SigningKey(n, e, pem, kid) {
	assert('string' === typeof n);
	assert('string' === typeof e);
	assert('string' === typeof pem);
	assert('string' === typeof kid);

	this.n = n;
	this.e = e;
	this.pem = pem;
	this.kid = kid;
}

SigningKey.parse = function(str) {
	assert('string' === typeof str);
	const json = JSON.parse(str);
	return new SigningKey(json.n, json.e, json.pem, json.kid);
};

function fixHexLength(hexStr) {
	assert('string' === typeof hexStr);

	if (hexStr.length % 2 === 0) {
		return hexStr;
	}

	return '0' + hexStr;
}

SigningKey.fromPem = function(pem, kid) {
	assert('string' === typeof pem);
	assert('string' === typeof kid);

	const parsedPem = parseAsn1(pem);

	let n = parsedPem.modulus.toString(16);
	n = fixHexLength(n);
	n = new Buffer(n, 'hex');
	n = base64Url.encode(n);

	let e = parsedPem.publicExponent.toString(16);
	e = fixHexLength(e);
	e = new Buffer(e, 'hex');
	e = base64Url.encode(e);

	return new SigningKey(n, e, pem, kid);
};

module.exports = SigningKey;
