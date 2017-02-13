'use strict';

const
	assert = require('assert');

function arrayOrEmpty(arr) {
	return Array.isArray(arr)
		? arr
		: [];
}

function parseKeys(keys) {
	return keys.map(JSON.parse);
}

function transformKeys(keys) {
	return keys.map(transformKey);
}

function transformKey(key) {
	if (!key.use || !key.kty) {
		// stored from a previous version of node-auth-jwks
		// unfortunately can't recover expiry :(
		return {
			n: key.n,
			e: key.e,
			kid: key.kid,
			use: 'sig',
			kty: 'RSA',
			alg: 'RS256'
		};
	}

	return key;
}

class AbstractPublicKeyStore {
	constructor() {
		assert('function' === typeof this._lookupPublicKeys, 'The function _lookupPublicKeys must be defined and return a promise');
		assert('function' === typeof this._storePublicKey, 'The function _storePublicKey must be defined and return a promise');
	}

	lookupPublicKeys() {
		return Promise
			.resolve()
			.then(() => this._lookupPublicKeys())
			.then(arrayOrEmpty)
			.then(parseKeys)
			.then(transformKeys);
	}

	storePublicKey(key) {
		return this._storePublicKey(JSON.stringify(key), key.exp);
	}
}

module.exports = AbstractPublicKeyStore;
