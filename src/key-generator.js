'use strict';

const assert = require('assert');
const uuid = require('uuid/v4');

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
	DEFAULT_SIGNING_KEY_OVERLAP = 5 * 60;

function KeyGenerator(opts) {
	assert(opts.publicKeyStore instanceof AbstractPublicKeyStore);
	this._publicKeyStore = opts.publicKeyStore;

	this.signingKeyAge = opts.signingKeyAge || DEFAULT_SIGNING_KEY_AGE;
	assert(this.signingKeyAge > 0, 'signingKeyAge must be positive');

	this.signingKeyOverlap = opts.signingKeyOverlap || DEFAULT_SIGNING_KEY_OVERLAP;
	assert(this.signingKeyOverlap > 0, 'signingKeyOverlap must be positive');

	switch (opts.signingKeyType) {
		case SIGNING_KEY_TYPE_RSA: {
			this.keygen = rsaKeygen.bind(null, rsaKeygen.normalize(opts.rsa));
			break;
		}
		case SIGNING_KEY_TYPE_EC: {
			this.keygen = ecKeygen.bind(null, ecKeygen.normalize(opts.ec));
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
	this._keyGenerationTask = this
		.keygen(uuid())
		.then(key => {
			key.jwk.exp = clock() + this.signingKeyAge + this.signingKeyOverlap;

			return this
				._publicKeyStore
				.storePublicKey(key.jwk)
				.then(() => {
					this._currentPrivateKey = key.signingKey;
					this._keyGenerationTask = undefined;
					return this._currentPrivateKey;
				});
		});

	return this._keyGenerationTask;
};

KeyGenerator.prototype.getCurrentPrivateKey = function getCurrentPrivateKey() {
	return this._keyGenerationTask
		? this._keyGenerationTask
		: Promise.resolve(this._currentPrivateKey);
};

module.exports = KeyGenerator;
