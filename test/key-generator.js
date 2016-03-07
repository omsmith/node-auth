'use strict';

const
	rewire = require('rewire'),
	sinon = require('sinon'),
	assert = require('assert'),
	AbstractPublicKeyStore = require('../src/abstract-public-key-store'),
	exampleKeys = require('./static/example-keys');

require('sinon-as-promised');

const
	TEST_SIGNING_KEY_AGE = 60 * 60,
	TEST_SIGNING_KEY_OVERLAP = 5 * 60,
	TEST_UUID = '1234';

class DummyPublicKeyStore extends AbstractPublicKeyStore {
	_storePublicKey() {
		throw '_storePublicKey must be mocked out';
	}

	_lookupPublicKeys() {
		throw '_lookupPublicKeys must be mocked out';
	}
}

describe('KeyGenerator', () => {
	let keyGenerator, publicKeyStoreMock, revertUuid, sandbox, clock, KeyGenerator;

	beforeEach(() => {
		clock = sinon.useFakeTimers(),
		KeyGenerator = rewire('../src/key-generator'),
		sandbox = sinon.sandbox.create();
		revertUuid = KeyGenerator.__set__('uuid', () => TEST_UUID);
		let dummyPublicKeyStore = new DummyPublicKeyStore();
		keyGenerator = new KeyGenerator({
			publicKeyStore: dummyPublicKeyStore
		});

		publicKeyStoreMock = sandbox.mock(keyGenerator.publicKeyStore);
	});

	afterEach(() => {
		clock.restore();
		revertUuid();
		publicKeyStoreMock.verify();
		sandbox.restore();
	});

	describe('run(...)', () => {
		it('calls _generateNewKeys right a way', () => {
			keyGenerator._generateNewKeys = sinon.spy();
			keyGenerator.run();
			assert(keyGenerator._generateNewKeys.calledOnce);
		});

		it('sets interval to call _generateNewKeys', () => {
			keyGenerator._generateNewKeys = sinon.spy();
			keyGenerator.run();
			clock.tick(TEST_SIGNING_KEY_AGE * 1000);
			assert(keyGenerator._generateNewKeys.calledTwice);
		});

		it('keeps calling _generateNewKeys', () => {
			keyGenerator._generateNewKeys = sinon.spy();
			keyGenerator.run();
			clock.tick(TEST_SIGNING_KEY_AGE * 15000);
			assert(1 + 15 === keyGenerator._generateNewKeys.callCount);
		});
	});

	describe('_generateNewKeys(...)', () => {
		it('stores proper public key', () => {
			const TICK_MS = 2000;
			clock.tick(TICK_MS);

			sandbox.stub(KeyGenerator.__get__('rsaKeygen'), 'generate', () => {
				return exampleKeys.pem();
			});

			publicKeyStoreMock.expects('_storePublicKey')
				.withArgs(JSON.stringify(exampleKeys.jwk(TEST_UUID).public_key),
				(TICK_MS / 1000) + TEST_SIGNING_KEY_AGE + TEST_SIGNING_KEY_OVERLAP)
				.resolves();

			keyGenerator._generateNewKeys();
			assert(keyGenerator._keyGenerationTask);

			return keyGenerator._keyGenerationTask.then(() => {
				assert(undefined === keyGenerator._keyGenerationTask);
				assert.deepEqual(keyGenerator._currentPrivateKey, exampleKeys.jwk(TEST_UUID).private_key);
			});
		});
	});

	describe('getCurrentPrivateKey(...)', () => {
		it('returns proper private key after yielding _keyGenerationTask if active', () => {

			keyGenerator._currentPrivateKey = exampleKeys.jwk(TEST_UUID).private_key;
			keyGenerator._keyGenerationTask = Promise.resolve();

			return keyGenerator.getCurrentPrivateKey()
				.then((result) => assert.deepEqual(result, exampleKeys.jwk(TEST_UUID).private_key));

		});

		it('returns proper private key when _keyGenerationTask is not active', () => {

			keyGenerator._currentPrivateKey = exampleKeys.jwk(TEST_UUID).private_key;
			keyGenerator._keyGenerationTask = undefined;

			return keyGenerator.getCurrentPrivateKey()
				.then((result) => assert.deepEqual(result, exampleKeys.jwk(TEST_UUID).private_key));

		});
	});

	describe('getJwks(...)', () => {
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

			return keyGenerator.getJwks()
				.then((result) => assert.deepEqual(result, {
					keys: []
				}));
		});
	});
});
