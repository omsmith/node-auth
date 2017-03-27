'use strict';

const CoreKeyGenerator = require('./core-key-generator');

function KeyGenerator(opts) {
	if (typeof opts !== 'object') {
		throw new TypeError(`"opts" should be an Object. Got "${typeof opts}".`);
	}
	this._coreKeyGenerator = new CoreKeyGenerator(opts);
	this._keyGenerationTask = null;
	this._currentPrivateKey = null;
	this._generateNewKeys = this._generateNewKeys.bind(this);
	this._generateNewKeys();
	setInterval(this._generateNewKeys, this._coreKeyGenerator._signingKeyAge * 1000);
}

KeyGenerator.prototype._generateNewKeys = function _generateNewKeys() {
	this._keyGenerationTask = this
		._coreKeyGenerator.generateNewKeys()
		.then(privateKey => {
			this._currentPrivateKey = privateKey;
			this._keyGenerationTask = undefined;
			return privateKey;
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
