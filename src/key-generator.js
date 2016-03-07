'use strict';

var
	SigningKey = require('./signing-key'),
	rsaKeygen = require('rsa-keygen'),
	co = require('co'),
	uuid = require('uuid');

const assert = require('assert');
const AbstractPublicKeyStore = require('./abstract-public-key-store');

/*eslint no-invalid-this: 0*/

const
	SIGNING_KEY_AGE = process.env.SIGNING_KEY_AGE || 60 * 60,
	SIGNING_KEY_OVERLAP = process.env.SIGNING_KEY_OVERLAP || 5 * 60,
	SIGNING_KEY_SIZE = process.env.SIGNING_KEY_SIZE || 1024;

function clock() {
	return Math.round(Date.now() / 1000);
}

function KeyGenerator(opts) {
	assert(opts.publicKeyStore instanceof AbstractPublicKeyStore);
	this.publicKeyStore = opts.publicKeyStore;
}

KeyGenerator.prototype.run = function() {
	this._generateNewKeys();
	setInterval(this._generateNewKeys.bind(this), SIGNING_KEY_AGE * 1000);
};

KeyGenerator.prototype._generateNewKeys = function() {
	const keypair = rsaKeygen.generate(SIGNING_KEY_SIZE);
	const kid = uuid();

	const privateKey = SigningKey.fromPem(keypair.private_key, kid);
	const publicKey = SigningKey.fromPem(keypair.public_key, kid);

	this._keyGenerationTask = this.publicKeyStore.storePublicKey(publicKey, clock() + SIGNING_KEY_AGE + SIGNING_KEY_OVERLAP)
		.then(() => {
			this._currentPrivateKey = privateKey;
			this._keyGenerationTask = undefined;
		});
};

KeyGenerator.prototype.getCurrentPrivateKey = co.wrap(function*() {
	if ('undefined' !== typeof this._keyGenerationTask) {
		yield this._keyGenerationTask;
	}

	return this._currentPrivateKey;
});

KeyGenerator.prototype.getJwks = co.wrap(function*() {
	return this.publicKeyStore.lookupPublicKeys()
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
});

module.exports = KeyGenerator;
