'use strict';

const
	assert = require('assert');

class AbstractPublicKeyStore {
	constructor() {
		assert('function' === typeof this._lookupPublicKeys, 'The function _lookupPublicKeys must be defined and return a promise');
		assert('function' === typeof this._storePublicKey, 'The function _storePublicKey must be defined and return a promise');
	}

	lookupPublicKeys() {
		return this._lookupPublicKeys()
			.then(keys => {
				if (Array.isArray(keys)) {
					return keys;
				}

				return [];
			});
	}

	storePublicKey(key) {
		return this._storePublicKey(JSON.stringify(key), key.exp);
	}
}

module.exports = AbstractPublicKeyStore;
