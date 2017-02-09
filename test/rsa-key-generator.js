'use strict';

const assert = require('assert');
const rewire = require('rewire');

const exampleKeys = require('./static/example-keys');

const TEST_RSA_SIGNING_KEY_SIZE = 1024;
const TEST_UUID = '1234';

class NodeRSAMock {
	exportKey(type) {
		switch (type) {
			case 'pkcs1-private-pem':
				return exampleKeys.pem().private_key;
			case 'pkcs1-public-pem':
				return exampleKeys.pem().public_key;
			default:
				throw new Error('exportKey called with unexpected arguments');
		}
	}
}

describe('RSA', () => {

	let keygen;

	beforeEach(() => {
		keygen = rewire('../src/rsa-key-generator'),
		keygen.__set__('NodeRSA', NodeRSAMock);
	});

	describe('validate', () => {
		it('should throw AssertionError when size is negative', () => {
			assert.throws(
				() => keygen.validate(-1024),
				assert.AssertionError,
				/signingKeySize/
			);
		});

		it('should throw AssertionError when size is zero', () => {
			assert.throws(
				() => keygen.validate(0),
				assert.AssertionError,
				/signingKeySize/
			);
		});

		it.skip('should throw AssertionError when size is less than 1024 | skipped because this isnt currently asserted', () => {
			assert.throws(
				() => keygen.validate(1023),
				assert.AssertionError,
				/signingKeySize/
			);
		});
	});

	describe('keygen', () => {
		it('should return the private pem as "pem" property', () => {
			const key = keygen(TEST_RSA_SIGNING_KEY_SIZE, TEST_UUID);

			assert.strictEqual(key.pem, exampleKeys.pem().private_key);
		});

		it('should return a public JWK as "jwk" property with provided kid', () => {
			const key = keygen(TEST_RSA_SIGNING_KEY_SIZE, TEST_UUID);
			const jwk = key.jwk;

			assert.strictEqual(typeof jwk, 'object');
			assert.strictEqual(typeof jwk.n, 'string');
			assert.strictEqual(typeof jwk.e, 'string');
			assert.strictEqual(jwk.kid, TEST_UUID);
			assert.strictEqual(jwk.kty, 'RSA');
			assert.strictEqual(jwk.use, 'sig');

			// no private values
			assert.strictEqual(jwk.d, undefined);
			assert.strictEqual(jwk.p, undefined);
			assert.strictEqual(jwk.q, undefined);
			assert.strictEqual(jwk.dp, undefined);
			assert.strictEqual(jwk.dq, undefined);
			assert.strictEqual(jwk.qi, undefined);
		});
	});

});
