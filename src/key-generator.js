'use strict';

const assert = require('assert');
const uuid = require('uuid');

const AbstractPublicKeyStore = require('./abstract-public-key-store');
const ecKeygen = require('./ec-key-generator');
const rsaKeygen = require('./rsa-key-generator');

const SIGNING_KEY_TYPE_RSA = 'RSA';
const SIGNING_KEY_TYPE_EC = 'EC';

function clock() {
	return Math.round(Date.now() / 1000);
}

const
	DEFAULT_SIGNING_KEY_AGE = 60 * 60,
	DEFAULT_SIGNING_KEY_OVERLAP = 5 * 60,
	DEFAULT_RSA_SIGNING_KEY_SIZE = 1024,
	DEFAULT_EC_CRV = 'P-256';

function KeyGenerator(opts) {
	assert(opts.publicKeyStore instanceof AbstractPublicKeyStore);
	this._publicKeyStore = opts.publicKeyStore;

	this.signingKeyAge = opts.signingKeyAge || DEFAULT_SIGNING_KEY_AGE;
	assert(this.signingKeyAge > 0, 'signingKeyAge must be positive');

	this.signingKeyOverlap = opts.signingKeyOverlap || DEFAULT_SIGNING_KEY_OVERLAP;
	assert(this.signingKeyOverlap > 0, 'signingKeyOverlap must be positive');

	switch (opts.signingKeyType) {
		case SIGNING_KEY_TYPE_RSA: {
			const signingKeySize = opts.rsa && opts.rsa.signingKeySize || DEFAULT_RSA_SIGNING_KEY_SIZE;
			rsaKeygen.validate(signingKeySize);
			this.keygen = rsaKeygen.bind(null, signingKeySize);
			break;
		}
		case SIGNING_KEY_TYPE_EC: {
			const crv = opts.ec && opts.ec.crv || DEFAULT_EC_CRV;
			ecKeygen.validate(crv);
			this.keygen = ecKeygen.bind(null, crv);
			break;
		}
		default: {
			throw new assert.AssertionError(`signingKeyType must be one of: "${SIGNING_KEY_TYPE_RSA}", "${SIGNING_KEY_TYPE_EC}"`);
		}
	}

	this._keyGenerationTask = null;
	this._currentPrivateKey = null;

	this._generateNewKeys = this._generateNewKeys.bind(this);
	this._generateNewKeys();
	setInterval(this._generateNewKeys, this.signingKeyAge * 1000);
}

KeyGenerator.prototype._generateNewKeys = function _generateNewKeys() {
	const key = this.keygen(uuid());
	key.jwk.exp = clock() + this.signingKeyAge + this.signingKeyOverlap;

	this._keyGenerationTask = this
		._publicKeyStore
		.storePublicKey(key.jwk)
		.then(() => {
			this._currentPrivateKey = key.signingKey;
			this._keyGenerationTask = undefined;
			return this._currentPrivateKey;
		});
};

KeyGenerator.prototype.getCurrentPrivateKey = function getCurrentPrivateKey() {
	return this._keyGenerationTask
		? this._keyGenerationTask
		: Promise.resolve(this._currentPrivateKey);
};

KeyGenerator.prototype.getJwks = function getJwks() {
	return this._publicKeyStore.lookupPublicKeys()
		.then(keys => {
			assert(Array.isArray(keys));

			const jwks = keys
				.map(JSON.parse)
				.map((key) => {
					if (!key.use || !key.kty) {
						// Stored from a previous version of node-auth-jwks
						return {
							n: key.n,
							e: key.e,
							kid: key.kid,
							use: 'sig',
							kty: 'RSA'
						};
					}

					return key;
				});

			return {
				keys: jwks
			};
		});
};

module.exports = KeyGenerator;
