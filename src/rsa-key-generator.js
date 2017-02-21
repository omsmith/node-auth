'use strict';

const assert = require('assert');
const base64Url = require('base64-url');
const parseAsn1 = require('parse-asn1');

// var to be rewireable in tests
var NodeRSA = require('node-rsa');

function fixHexLength(hexStr) {
	if (hexStr.length % 2 === 0) {
		return hexStr;
	}

	return '0' + hexStr;
}

function pemToJwk(kid, pem) {
	const parsedPem = parseAsn1(pem);

	let n = parsedPem.modulus.toString(16);
	n = fixHexLength(n);
	n = new Buffer(n, 'hex');
	n = base64Url.encode(n);

	let e = parsedPem.publicExponent.toString(16);
	e = fixHexLength(e);
	e = new Buffer(e, 'hex');
	e = base64Url.encode(e);

	return {
		n,
		e,
		kid,
		kty: 'RSA',
		use: 'sig',
		alg: 'RS256'
	};
}

function keygen(size, kid) {
	const key = new NodeRSA({
		b: size // b: key size in bits
	});

	const pem = key.exportKey('pkcs1-private-pem');
	const jwk = pemToJwk(kid, key.exportKey('pkcs1-public-pem'));

	return {
		jwk,
		signingKey: {
			kid,
			pem,
			alg: 'RS256'
		}
	};
}

module.exports = keygen;
module.exports.validate = function(signingKeySize) {
	assert(signingKeySize > 0, 'signingKeySize must be positive');
};
