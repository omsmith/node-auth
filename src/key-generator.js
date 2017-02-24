'use strict';

const uuid = require('uuid/v4');

const AbstractPublicKeyStore = require('./abstract-public-key-store');
const clock = require('./clock');
const ecKeygen = require('./ec-key-generator');
const rsaKeygen = require('./rsa-key-generator');

const SIGNING_KEY_TYPE_RSA = 'RSA';
const SIGNING_KEY_TYPE_EC = 'EC';
const EXPIRY_CLOCK_SKEW = 5 * 60;
const DEFAULT_SIGNING_KEY_AGE = 60 * 60;
const MINIMUM_SIGNING_KEY_AGE = 60 * 60;
const MAXIMUM_SIGNING_KEY_AGE = 24 * 60 * 60;
const DEFAULT_SIGNING_KEY_OVERLAP = 5 * 60;
const MINIMUM_SIGNING_KEY_OVERLAP = 5 * 60;

/* @this */
function parseOpts(opts) {
	if (typeof opts !== 'object') {
		throw new TypeError(`"opts" should be an Object. Got "${typeof opts}".`);
	}

	if (!(opts.publicKeyStore instanceof AbstractPublicKeyStore)) {
		throw new TypeError('"opts.publicKeyStore" should be an implementation of AbstractPublicKeyStore');
	}

	this._publicKeyStore = opts.publicKeyStore;

	if (typeof opts.signingKeyAge !== 'undefined') {
		const age = opts.signingKeyAge;

		if (typeof age !== 'number' || age !== Math.round(age)) {
			throw new TypeError(`"opts.signingKeyAge" should be a integer. Got "${age}" (${typeof age}).`);
		}

		if (age < MINIMUM_SIGNING_KEY_AGE || MAXIMUM_SIGNING_KEY_AGE < age) {
			throw new Error(`"opts.signingKeyAge" must be between ${MINIMUM_SIGNING_KEY_AGE} and ${MAXIMUM_SIGNING_KEY_AGE}. Got "${age}".`);
		}

		this._signingKeyAge = age;
	}

	if (typeof opts.signingKeyOverlap !== 'undefined') {
		const overlap = opts.signingKeyOverlap;

		if (typeof overlap !== 'number' || overlap !== Math.round(overlap)) {
			throw new TypeError(`"opts.signingKeyOverlap" should be a integer. Got "${overlap}" (${typeof overlap}).`);
		}

		if (overlap < MINIMUM_SIGNING_KEY_OVERLAP) {
			throw new Error(`"opts.signingKeyOverlap" must be at least ${MINIMUM_SIGNING_KEY_OVERLAP}. Got "${overlap}".`);
		}

		if (this._signingKeyAge < overlap) {
			throw new Error(`"opts.signingKeyOverlap" must be less than "opts.signingKeyAge" (${this._signingKeyAge}). Got "${overlap}".`);
		}

		this._signingKeyOverlap = overlap;
	}

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
			throw new Error(`signingKeyType must be one of: "${SIGNING_KEY_TYPE_RSA}", "${SIGNING_KEY_TYPE_EC}"`);
		}
	}
}

function KeyGenerator(opts) {
	this._signingKeyAge = DEFAULT_SIGNING_KEY_AGE;
	this._signingKeyOverlap = DEFAULT_SIGNING_KEY_OVERLAP;

	this._publicKeyStore = null;
	this._keyGenerationTask = null;
	this._currentPrivateKey = null;
	this._generateNewKeys = this._generateNewKeys.bind(this);

	parseOpts.call(this, opts);

	this._generateNewKeys();
	setInterval(this._generateNewKeys, this._signingKeyAge * 1000);
}

KeyGenerator.prototype._generateNewKeys = function _generateNewKeys() {
	this._keyGenerationTask = this
		.keygen(uuid())
		.then(key => {
			key.jwk.exp = clock() + this._signingKeyAge + this._signingKeyOverlap + EXPIRY_CLOCK_SKEW;

			return this
				._publicKeyStore
				.storePublicKey(key.jwk)
				.then(() => {
					this._currentPrivateKey = key.signingKey;
					this._keyGenerationTask = undefined;
					return this._currentPrivateKey;
				});
		})
		.catch(() => {
			return new Promise(resolve => setTimeout(resolve, 100).unref())
				.then(this._generateNewKeys);
		});

	return this._keyGenerationTask;
};

KeyGenerator.prototype.getCurrentPrivateKey = function getCurrentPrivateKey() {
	return this._keyGenerationTask
		? this._keyGenerationTask
		: Promise.resolve(this._currentPrivateKey);
};

module.exports = KeyGenerator;
