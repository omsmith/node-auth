'use strict';

const
	AbstractPublicKeyStore = require('../src/abstract-public-key-store');

class DummyPublicKeyStore extends AbstractPublicKeyStore {
	_storePublicKey() {
		throw '_storePublicKey must be mocked out';
	}

	_lookupPublicKeys() {
		throw '_lookupPublicKeys must be mocked out';
	}
}

module.exports = DummyPublicKeyStore;
