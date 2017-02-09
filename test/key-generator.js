'use strict';

const assert = require('assert');
const sinon = require('sinon');
const xtend = require('xtend');

require('sinon-as-promised');

const KeyGenerator = require('../src/key-generator');
const ecKeygen = require('../src/ec-key-generator');
const rsaKeygen = require('../src/rsa-key-generator');

const DummyPublicKeyStore = require('./dummy-public-key-store');

const
	TEST_SIGNING_KEY_AGE = 60 * 60,
	TEST_SIGNING_KEY_OVERLAP = 5 * 60;

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
			signingKeyType: 'RSA',
			rsa: {
				signingKeySize: 1024
			}
		}, opts));
	}

	describe('constructor(...)', () => {
		it('should throw if publicKeyStore is not an AbstractPublicKeyStore', () => {
			assert.throws(
				() => createKeyGenerator({ publicKeyStore: {} }),
				assert.AssertionError
			);
		});

		it('should throw if signingKeyAge is negative', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyAge: -1 }),
				assert.AssertionError,
				/signingKeyAge/
			);
		});

		it.skip('should throw if signingKeyAge is zero | skipped because default is used in this case, perhaps unintentionally', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyAge: 0 }),
				assert.AssertionError,
				/signingKeyAge/
			);
		});

		it('should throw if signingKeyOverlap is negative', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyOverlap: -1 }),
				assert.AssertionError,
				/signingKeyOverlap/
			);
		});

		it.skip('should throw if signingKeyOverlap is zero | skipped because default is used in this case, perhaps unintentionally', () => {
			assert.throws(
				() => createKeyGenerator({ signingKeyOverlap: 0 }),
				assert.AssertionError,
				/signingKeyOverlap/
			);
		});

		it('should throw if signingKeyType is invalid', () => {
			for (const alg of ['dsa', 'rsa', 'rSA', 'eCDSA', 'foo', 1]) {
				assert.throws(
					() => createKeyGenerator({ signingKeyType: alg }),
					assert.AssertionError,
					/signingKeyType/
				);
			}
		});

		describe('RSA', () => {
			beforeEach(() => {
				sandbox.stub(KeyGenerator.prototype, '_generateNewKeys');
			});

			it('should check options with rsaKeygen.validate and succeed', () => {
				sandbox.spy(rsaKeygen, 'validate');
				assert.strictEqual(0, rsaKeygen.validate.callCount);
				createKeyGenerator({ signingKeyType: 'RSA', rsa: { singingKeySize: 1024 } });
				assert.strictEqual(1, rsaKeygen.validate.callCount);
			});
		});

		describe('EC', () => {
			beforeEach(() => {
				sandbox.stub(KeyGenerator.prototype, '_generateNewKeys');
			});

			it('should check options with ecKeygen.validate and succeed', () => {
				sandbox.spy(ecKeygen, 'validate');
				assert.strictEqual(0, ecKeygen.validate.callCount);
				createKeyGenerator({ signingKeyType: 'EC', ec: { crv: 'P-256' } });
				assert.strictEqual(1, ecKeygen.validate.callCount);
			});
		});

		describe('should call _generateNewKeys', () => {
			beforeEach(() => {
				sandbox.stub(KeyGenerator.prototype, '_generateNewKeys');
				createKeyGenerator();
			});

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

				keygen._generateNewKeys();

				sinon.assert.calledWith(
					dummyPublicKeyStore.storePublicKey,
					sinon.match({ kty: 'RSA' }),
					Math.round(CURRENT_TIME_MS / 1000) + TEST_SIGNING_KEY_AGE + TEST_SIGNING_KEY_OVERLAP
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

				keygen._generateNewKeys();

				sinon.assert.calledWith(
					dummyPublicKeyStore.storePublicKey,
					sinon.match({ kty: 'EC' }),
					Math.round(CURRENT_TIME_MS / 1000) + TEST_SIGNING_KEY_AGE + TEST_SIGNING_KEY_OVERLAP
				);
			});
		});

		describe('should initialize _keyGenerationTask', () => {
			let keygen = null;
			beforeEach(done => {
				keygen = createKeyGenerator();
				return keygen._keyGenerationTask.then(() => {
					keygen._keyGenerationTask = undefined;
					keygen._currentPrivateKey = null;
//					dummyPublicKeyStore.storePublicKey.reset();
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
					assert.strictEqual('string', typeof keygen._currentPrivateKey);
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

	describe('getJwks(...)', () => {
		beforeEach(() => sandbox.stub(dummyPublicKeyStore, 'storePublicKey').resolves());

		let keygen;
		beforeEach(() => keygen = createKeyGenerator());

		it('should return all public keys returned from the store, transforming old format', () => {
			sandbox
				.stub(dummyPublicKeyStore, 'lookupPublicKeys')
				.resolves([
					JSON.stringify({
						n: 'some-n-1',
						e: 'some-e-1',
						kid: '123',
						kty: 'RSA',
						use: 'sig'
					}),
					JSON.stringify({
						n: 'some-n-2',
						e: 'some-e-2',
						kid: '456',
						pem: 'some-pem-2'
					}),
					JSON.stringify({
						x: 'some-x-1',
						y: 'some-y-1',
						kid: '789',
						kty: 'EC',
						crv: 'P-384',
						use: 'sig'
					})
				]);

			return keygen
				.getJwks()
				.then((result) => assert.deepEqual(result, {
					keys: [
						{
							n: 'some-n-1',
							e: 'some-e-1',
							use: 'sig',
							kty: 'RSA',
							kid: '123'
						},
						{
							n: 'some-n-2',
							e: 'some-e-2',
							use: 'sig',
							kty: 'RSA',
							kid: '456'
						},
						{
							x: 'some-x-1',
							y: 'some-y-1',
							kid: '789',
							use: 'sig',
							kty: 'EC',
							crv: 'P-384'
						}
					]
				}));
		});
	});
});
