'use strict';

const assert = require('assert');
const sinon = require('sinon');
const xtend = require('xtend');

const KeyGenerator = require('../src/key-generator');
const CoreKeyGenerator = require('../src/core-key-generator');

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

		it('instantiates CoreKeyGenerator', () => {
			const generator = createKeyGenerator();
			assert(generator._coreKeyGenerator instanceof CoreKeyGenerator);
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

		describe('RSA', /* @this */ function() {
			this.timeout(5000);

			it('calls storePublicKey with public rsa jwk and proper expiry', () => {
				const CURRENT_TIME_MS = 25000;
				clock.tick(CURRENT_TIME_MS);

				const keygen = createKeyGenerator({ signingKeyType: 'RSA' });
				// _generateNewKeys is called immediately by the contrusctor, so reset the stub
				dummyPublicKeyStore.storePublicKey.resetHistory();
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
				dummyPublicKeyStore.storePublicKey.resetHistory();
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
