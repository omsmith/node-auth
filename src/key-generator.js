'use strict';

var
	SigningKey = require('./signing-key'),
	rsaKeygen = require('rsa-keygen'),
	uuid = require('uuid');

const assert = require('assert');
const AbstractPublicKeyStore = require('./abstract-public-key-store');
const SIGNING_KEY_TYPE_RSA = 'RSA';

function clock() {
	return Math.round(Date.now() / 1000);
}

const
	DEFAULT_SIGNING_KEY_AGE = 60 * 60,
	DEFAULT_SIGNING_KEY_OVERLAP = 5 * 60,
	DEFAULT_RSA_SIGNING_KEY_SIZE = 1024;

function KeyGenerator(opts) {
	assert(opts.publicKeyStore instanceof AbstractPublicKeyStore);
	this._publicKeyStore = opts.publicKeyStore;

	this.signingKeyAge = opts.signingKeyAge || DEFAULT_SIGNING_KEY_AGE;
	assert(this.signingKeyAge > 0, 'signingKeyAge must be positive');

	this.signingKeyOverlap = opts.signingKeyOverlap || DEFAULT_SIGNING_KEY_OVERLAP;
	assert(this.signingKeyOverlap > 0, 'signingKeyOverlap must be positive');

	assert(SIGNING_KEY_TYPE_RSA === opts.signingKeyType, 'Only "RSA" is supported currently');

	this.rsaSettings = {
		signingKeySize: opts.rsa && opts.rsa.signingKeySize || DEFAULT_RSA_SIGNING_KEY_SIZE
	};

	assert(this.rsaSettings.signingKeySize > 0, 'signingKeySize must be positive');

	this._keyGenerationTask = null;
	this._currentPrivateKey = null;

	this._generateNewKeys = this._generateNewKeys.bind(this);
	this._generateNewKeys();
	setInterval(this._generateNewKeys, this.signingKeyAge * 1000);
}

KeyGenerator.prototype._generateNewKeys = function _generateNewKeys() {
	const keypair = rsaKeygen.generate(this.rsaSettings.signingKeySize);
	const kid = uuid();

	const privateKey = SigningKey.fromPem(keypair.private_key, kid);
	const publicKey = SigningKey.fromPem(keypair.public_key, kid);

	const expiry = clock() + this.signingKeyAge + this.signingKeyOverlap;

	this._keyGenerationTask = this._publicKeyStore.storePublicKey(publicKey, expiry)
		.then(() => {
			this._currentPrivateKey = privateKey;
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

			const jwks = keys.map(SigningKey.parse)
				.map((key) => ({
					n: key.n,
					e: key.e,
					kid: key.kid,
					use: 'sig',
					kty: 'RSA'
				}));

			return {
				keys: jwks
			};
		});
};

module.exports = KeyGenerator;
