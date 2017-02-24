'use strict';

const assert = require('assert');

const keygen = require('../src/rsa-key-generator');

const TEST_UUID = '1234';

describe('RSA', () => {
	describe('normalize', () => {
		it('should throw TypeError when size is not a number', () => {
			for (const size of ['cats', '2048', {}, null]) {
				assert.throws(
					() => keygen.normalize({ signingKeySize: size }),
					TypeError,
					/signingKeySize.+Number/
				);
			}
		});

		it('should throw TypeError when size in not an integer', () => {
			assert.throws(
				() => keygen.normalize({ signingKeySize: 2048.5 }),
				TypeError,
				/signingKeySize.+integer/
			);
		});

		it('should throw Error when size is negative', () => {
			assert.throws(
				() => keygen.normalize({ signingKeySize: -1024 }),
				Error,
				/signingKeySize/
			);
		});

		it('should throw Error when size is zero', () => {
			assert.throws(
				() => keygen.normalize({ signingKeySize: 0 }),
				Error,
				/signingKeySize/
			);
		});

		it('should throw Error when size is less than 2048', () => {
			assert.throws(
				() => keygen.normalize({ signingKeySize: 1024 }),
				Error,
				/signingKeySize/
			);
			assert.throws(
				() => keygen.normalize({ signingKeySize: 2047 }),
				Error,
				/signingKeySize/
			);
		});

		it('should return normalized, new, object when valid', () => {
			const inputOpts = { signingKeySize: 4096 };
			const normal = keygen.normalize(inputOpts);
			assert.strictEqual(normal.size, 4096);
			assert.notStrictEqual(normal, inputOpts);
		});

		it('should return defaults when values not provided', () => {
			const inputOpts = {};
			const normal = keygen.normalize(inputOpts);
			assert.strictEqual(normal.size, 2048);
			assert.notStrictEqual(normal, inputOpts);
		});

		it('should return defaults when undefined', () => {
			const normal = keygen.normalize();
			assert.strictEqual(normal.size, 2048);
		});
	});

	describe('keygen', () => {
		it('should return the signing key as "signingKey" property', () => {
			return keygen({ signingKeySize: 2048 }, TEST_UUID)
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
			return keygen({ signingKeySize: 2048 }, TEST_UUID)
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
