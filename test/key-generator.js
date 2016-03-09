'use strict';

const
	rewire = require('rewire'),
	sinon = require('sinon'),
	assert = require('assert'),
	DummyPublicKeyStore = require('./dummy-public-key-store'),
	exampleKeys = require('./static/example-keys');

require('sinon-as-promised');

const
	TEST_SIGNING_KEY_AGE = 60 * 60,
	TEST_SIGNING_KEY_OVERLAP = 5 * 60,
	TEST_SIGNING_KEY_TYPE = 'RSA',

	TEST_RSA_SIGNING_KEY_SIZE = 1024,

	TEST_UUID = '1234';

const
	dummyPublicKeyStore = new DummyPublicKeyStore();

describe('KeyGenerator', () => {
	let publicKeyStoreMock, revertUuid, sandbox, clock, KeyGenerator;

	beforeEach(() => {
		clock = sinon.useFakeTimers(),
		KeyGenerator = rewire('../src/key-generator'),
		sandbox = sinon.sandbox.create();
		revertUuid = KeyGenerator.__set__('uuid', () => TEST_UUID);
		publicKeyStoreMock = sandbox.mock(dummyPublicKeyStore);

		sandbox.stub(KeyGenerator.__get__('rsaKeygen'), 'generate', () => {
			return exampleKeys.pem();
		});

	});

	afterEach(() => {
		clock.restore();
		revertUuid();
		publicKeyStoreMock.verify();
		sandbox.restore();
	});

	function createKeyGenerator() {
		return new KeyGenerator({
			publicKeyStore: dummyPublicKeyStore,
			signingKeyAge: TEST_SIGNING_KEY_AGE,
			signingKeyOverlap: TEST_SIGNING_KEY_OVERLAP,
			signingKeyType: TEST_SIGNING_KEY_TYPE,
			rsa: {
				signingKeySize: TEST_RSA_SIGNING_KEY_SIZE
			}
		});
	}

	describe('constructor(...)', () => {
		let generateNewKeysSpy;
		beforeEach(() => {
			generateNewKeysSpy = sinon.spy();
			KeyGenerator.__set__('KeyGenerator.prototype._generateNewKeys', generateNewKeysSpy);
			createKeyGenerator();
		});

		it('calls _generateNewKeys right a way', () => {
			assert(generateNewKeysSpy.calledOnce);
		});

		it('sets interval to call _generateNewKeys', () => {
			clock.tick(TEST_SIGNING_KEY_AGE * 1000);
			assert(generateNewKeysSpy.calledTwice);
		});

		it('keeps calling _generateNewKeys', () => {
			clock.tick(TEST_SIGNING_KEY_AGE * 15000);
			assert(1 + 15 === generateNewKeysSpy.callCount);
		});
	});

	describe('_generateNewKeys(...)', () => {
		beforeEach(() => {
			const CURRENT_TIME_MS = 25000;
			clock.tick(CURRENT_TIME_MS);

			publicKeyStoreMock.expects('_storePublicKey')
				.withArgs(JSON.stringify(exampleKeys.jwk(TEST_UUID).public_key),
				Math.round(CURRENT_TIME_MS / 1000) + TEST_SIGNING_KEY_AGE + TEST_SIGNING_KEY_OVERLAP)
				.resolves();
		});

		it('calls _storePublicKey with proper parameters', () => {
			createKeyGenerator();
		});

		it('initializes _keyGenerationTask', () => {
			const keyGenerator = createKeyGenerator();
			assert(keyGenerator._keyGenerationTask);

			return keyGenerator._keyGenerationTask.then(() => {
				assert(undefined === keyGenerator._keyGenerationTask);
				assert.deepEqual(keyGenerator._currentPrivateKey,
					exampleKeys.jwk(TEST_UUID).private_key);
			});
		});

		it('_keyGenerationTask resets itself', () => {
			const keyGenerator = createKeyGenerator();

			return keyGenerator._keyGenerationTask.then(() => {
				assert(undefined === keyGenerator._keyGenerationTask);
			});
		});

		it('_keyGenerationTask resolves _currentPrivateKey', () => {
			const keyGenerator = createKeyGenerator();

			return keyGenerator._keyGenerationTask.then(() => {
				assert.deepEqual(keyGenerator._currentPrivateKey,
					exampleKeys.jwk(TEST_UUID).private_key);
			});
		});
	});

	describe('getCurrentPrivateKey(...)', () => {
		let keyGenerator;
		beforeEach(() => {
			publicKeyStoreMock.expects('_storePublicKey')
				.resolves();

			keyGenerator = createKeyGenerator();
		});

		it('returns proper private key when _keyGenerationTask if defined', () => {
			keyGenerator._keyGenerationTask = Promise.resolve(exampleKeys.jwk(TEST_UUID).private_key);

			return keyGenerator.getCurrentPrivateKey()
				.then((result) => assert.deepEqual(result, exampleKeys.jwk(TEST_UUID).private_key));

		});

		it('returns proper private key when _keyGenerationTask is not defined', () => {
			keyGenerator._currentPrivateKey = exampleKeys.jwk(TEST_UUID).private_key;
			keyGenerator._keyGenerationTask = undefined;

			return keyGenerator.getCurrentPrivateKey()
				.then((result) => assert.deepEqual(result, exampleKeys.jwk(TEST_UUID).private_key));

		});
	});

	describe('getJwks(...)', () => {
		beforeEach(() => {
			publicKeyStoreMock.expects('_storePublicKey')
				.resolves();
		});

		it('returns all found public keys', () => {

			publicKeyStoreMock.expects('_lookupPublicKeys')
				.resolves([
					JSON.stringify({
						n: 'some-n-1',
						e: 'some-e-1',
						pem: 'some-pem-1',
						kid: '123'
					}),
					JSON.stringify({
						n: 'some-n-2',
						e: 'some-e-2',
						pem: 'some-pem-2',
						kid: '456'
					})
				]);

			const keyGenerator = createKeyGenerator();

			return keyGenerator.getJwks()
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
						}
					]
				}));
		});

		it('returns [] when undefined', () => {
			publicKeyStoreMock.expects('_lookupPublicKeys')
				.resolves(undefined);

			const keyGenerator = createKeyGenerator();

			return keyGenerator.getJwks()
				.then((result) => assert.deepEqual(result, {
					keys: []
				}));
		});
	});
});
