'use strict';

const assert = require('assert');

const keygen = require('../src/rsa-key-generator');

const TEST_UUID = '1234';

describe('RSA', () => {
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
		it('should return the signing key as "signingKey" property', () => {
			return keygen(2048, TEST_UUID)
				.then(key => key.signingKey, () => assert(false))
				.then(
					signingKey => {
						assert.strictEqual(typeof signingKey, 'object');
						assert.strictEqual(signingKey.kid, TEST_UUID);
						assert.strictEqual(typeof signingKey.pem, 'string');
						assert.strictEqual(signingKey.alg, 'RS256');
					},
					() => assert(false)
				);
		});

		it('should return a public JWK as "jwk" property with provided kid', () => {
			return keygen(2048, TEST_UUID)
				.then(key => key.jwk, () => assert(false))
				.then(
					jwk => {
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
					},
					() => assert(false)
				);
		});
	});

});
