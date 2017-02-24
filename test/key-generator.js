'use strict';

const assert = require('assert');
const sinon = require('sinon');
const xtend = require('xtend');

require('sinon-as-promised');

const KeyGenerator = require('../src/key-generator');
const ecKeygen = require('../src/ec-key-generator');
const rsaKeygen = require('../src/rsa-key-generator');

const DummyPublicKeyStore = require('./dummy-public-key-store');

const EXPIRY_CLOCK_SKEW = 5 * 60;
const TEST_SIGNING_KEY_AGE = 60 * 60;
const TEST_SIGNING_KEY_OVERLAP = 5 * 60;

const
	dummyPublicKeyStore = new DummyPublicKeyStore();

describe('KeyGenerator', () => {
	let sandbox, clock;

	beforeEach(() => {
		clock = sinon.useFakeTimers(),
		sandbox = sinon.sandbox.create();
	});

	afterEach(() => {
		clock.restore();
		sandbox.restore();
	});

	function createKeyGenerator(opts) {
		return new KeyGenerator(xtend({
			publicKeyStore: dummyPublicKeyStore,
			signingKeyAge: TEST_SIGNING_KEY_AGE,
			signingKeyOverlap: TEST_SIGNING_KEY_OVERLAP,
			signingKeyType: 'EC',
			ec: {
				crv: 'P-256'
			},
			rsa: {
				signingKeySize: 2048
			}
		}, opts));
	}

	describe('constructor(...)', () => {
		beforeEach(() => sandbox.stub(KeyGenerator.prototype, '_generateNewKeys'));

		it('should throw if options is not an object', () => {
			for (const val of [undefined, 'hi!', function() {}, 1000]) {
				assert.throws(
					() => new KeyGenerator(val),
					TypeError,
					/opts.+Object/
				);
			}
		});

		it('should throw if publicKeyStore is not an AbstractPublicKeyStore', () => {
			assert.throws(
				() => createKeyGenerator({ publicKeyStore: {} }),
				TypeError,
				/publicKeyStore.+AbstractPublicKeyStore/
			);
		});

		it('should throw if signingKeyAge is not an integer', () => {
			for (const val of ['3600', {}, function() {}, 3600.5]) {
				assert.throws(
					() => createKeyGenerator({ signingKeyAge: val }),
					TypeError,
					/signingKeyAge.+integer/
				);
			}
		});

		it('should throw if signingKeyAge is negative', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyAge: -1 }),
				Error,
				/signingKeyAge/
			);
		});

		it('should throw if signingKeyAge is zero', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyAge: 0 }),
				Error,
				/signingKeyAge/
			);
		});

		it('should throw is signingKeyAge is too large', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyAge: 24 * 60 * 60 + 1 }),
				Error,
				/signingKeyAge/
			);
		});

		it('should throw if signingKeyOverlap is not an integer', () => {
			for (const val of ['3000', {}, function() {}, 3000.5]) {
				assert.throws(
					() => createKeyGenerator({ signingKeyOverlap: val }),
					TypeError,
					/signingKeyOverlap.+integer/
				);
			}
		});

		it('should throw if signingKeyOverlap is negative', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyOverlap: -1 }),
				Error,
				/signingKeyOverlap/
			);
		});

		it('should throw if signingKeyOverlap is zero', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyOverlap: 0 }),
				Error,
				/signingKeyOverlap/
			);
		});

		it('should throw is signingKeyOverlap is greater than signingKeyAge', () => {
			createKeyGenerator({ signingKeyAge: 4000, signingKeyOverlap: 4000 });
			assert.throws(
				() => createKeyGenerator({ signingKeyAge: 4000, signingKeyOverlap: 4001 }),
				Error,
				/signingKeyOverlap.+signingKeyAge/
			);
		});

		it('should throw if signingKeyType is invalid', () => {
			for (const alg of ['dsa', 'rsa', 'rSA', 'eCDSA', 'foo', 1]) {
				assert.throws(
					() => createKeyGenerator({ signingKeyType: alg }),
					Error,
					/signingKeyType/
				);
			}
		});

		describe('RSA', () => {
			it('should check options with rsaKeygen.normalize and succeed', () => {
				sandbox.spy(rsaKeygen, 'normalize');
				assert.strictEqual(0, rsaKeygen.normalize.callCount);
				createKeyGenerator({ signingKeyType: 'RSA', rsa: { singingKeySize: 2048 } });
				assert.strictEqual(1, rsaKeygen.normalize.callCount);
			});
		});

		describe('EC', () => {
			it('should check options with ecKeygen.normalize and succeed', () => {
				sandbox.spy(ecKeygen, 'normalize');
				assert.strictEqual(0, ecKeygen.normalize.callCount);
				createKeyGenerator({ signingKeyType: 'EC', ec: { crv: 'P-256' } });
				assert.strictEqual(1, ecKeygen.normalize.callCount);
			});
		});

		describe('should call _generateNewKeys', () => {
			beforeEach(() => createKeyGenerator());

			it('right away', () => {
				assert.strictEqual(1, KeyGenerator.prototype._generateNewKeys.callCount);
			});

			it('every signingKeyAge seconds', () => {
				clock.tick(TEST_SIGNING_KEY_AGE * 1000);
				assert.strictEqual(1 + 1, KeyGenerator.prototype._generateNewKeys.callCount);

				clock.tick(TEST_SIGNING_KEY_AGE * 1000 * 15);
				assert.strictEqual(1 + 1 + 15, KeyGenerator.prototype._generateNewKeys.callCount);
			});
		});
	});

	describe('_generateNewKeys(...)', () => {
		beforeEach(() => sandbox.stub(dummyPublicKeyStore, 'storePublicKey').resolves());

		describe('RSA', () => {
			it('calls storePublicKey with public rsa jwk and proper expiry', () => {
				const CURRENT_TIME_MS = 25000;
				clock.tick(CURRENT_TIME_MS);

				const keygen = createKeyGenerator({ signingKeyType: 'RSA' });
				// _generateNewKeys is called immediately by the contrusctor, so reset the stub
				dummyPublicKeyStore.storePublicKey.reset();
				assert.strictEqual(0, dummyPublicKeyStore.storePublicKey.callCount);

				return keygen
					._generateNewKeys()
					.then(
						() => {
							sinon.assert.calledWith(
								dummyPublicKeyStore.storePublicKey,
								sinon.match({
									kty: 'RSA',
									alg: 'RS256',
									exp: Math.round(CURRENT_TIME_MS / 1000)
										+ TEST_SIGNING_KEY_AGE
										+ TEST_SIGNING_KEY_OVERLAP
										+ EXPIRY_CLOCK_SKEW
								})
							);
						},
						() => assert(false)
					);
			});
		});

		describe('EC', () => {
			it('calls storePublicKey with public ec jwk and proper expiry', () => {
				const CURRENT_TIME_MS = 25000;
				clock.tick(CURRENT_TIME_MS);

				const keygen = createKeyGenerator({ signingKeyType: 'EC' });
				// _generateNewKeys is called immediately by the contrusctor, so reset the stub
				dummyPublicKeyStore.storePublicKey.reset();
				assert.strictEqual(0, dummyPublicKeyStore.storePublicKey.callCount);

				return keygen
					._generateNewKeys()
					.then(
						() => {
							sinon.assert.calledWith(
								dummyPublicKeyStore.storePublicKey,
								sinon.match({
									kty: 'EC',
									alg: sinon.match(/^ES\d\d\d$/),
									exp: Math.round(CURRENT_TIME_MS / 1000)
										+ TEST_SIGNING_KEY_AGE
										+ TEST_SIGNING_KEY_OVERLAP
										+ EXPIRY_CLOCK_SKEW
								})
							);
						},
						() => assert(false)
					);
			});
		});

		describe('should initialize _keyGenerationTask', () => {
			let keygen = null;
			beforeEach(done => {
				keygen = createKeyGenerator();
				keygen._keyGenerationTask.then(() => {
					keygen._keyGenerationTask = undefined;
					keygen._currentPrivateKey = null;
					keygen._generateNewKeys();
					done();
				});
			});

			afterEach(() => keygen = null);

			it('', () => {
				assert.strictEqual('function', typeof keygen._keyGenerationTask.then);
			});

			it('which resets itself', () => {
				return keygen._keyGenerationTask.then(() => {
					assert(undefined === keygen._keyGenerationTask);
				});
			});

			it('which sets and resolves to _currentPrivateKey', () => {
				assert.strictEqual(null, keygen._currentPrivateKey);
				return keygen._keyGenerationTask.then(val => {
					assert.strictEqual('object', typeof keygen._currentPrivateKey);
					assert.strictEqual(keygen._currentPrivateKey, val);
				});
			});
		});
	});

	describe('getCurrentPrivateKey(...)', () => {
		beforeEach(() => sandbox.stub(dummyPublicKeyStore, 'storePublicKey').resolves());

		let keygen;
		beforeEach(() => keygen = createKeyGenerator());

		it('returns currently generating key when ongoing', () => {
			const task = Promise.resolve('cats');

			keygen._keyGenerationTask = task;

			return keygen
				.getCurrentPrivateKey()
				.then(key => assert.strictEqual('cats', key));
		});

		it('returns current key when generation task is not ongoing', () => {
			keygen._keyGenerationTask = undefined;
			keygen._currentPrivateKey = 'dogs';

			return keygen
				.getCurrentPrivateKey()
				.then(key => assert.strictEqual('dogs', key));
		});
	});
});
