'use strict';

const assert = require('assert');

const keygen = require('../src/ec-key-generator');

const TEST_UUID = '1234';

describe('EC', () => {
	describe('validate', () => {
		for (const crv of ['P-256', 'P-384', 'P-521']) {
			it(`should not throw when crv is ${crv}`, () => {
				keygen.validate(crv);
			});
		}

		it('should throw when crv is anything else', () => {
			for (const crv of ['P-123', 1024, 'cats']) {
				assert.throws(
					() => keygen.validate(crv),
					Error,
					/Unknown curve/
				);
			}
		});
	});

	describe('keygen', () => {
		for (const crv of ['P-256', 'P-384', 'P-521']) {
			describe(crv, () => {
				it('should return the private pem as "pem" property', () => {
					const key = keygen(crv, TEST_UUID);

					assert.strictEqual(typeof key.pem, 'string');
				});

				it('should return a public JWK as "jwk" property with provided kid', () => {
					const key = keygen(crv, TEST_UUID);
					const jwk = key.jwk;

					assert.strictEqual(typeof jwk, 'object');
					assert.strictEqual(typeof jwk.x, 'string');
					assert.strictEqual(typeof jwk.y, 'string');
					assert.strictEqual(jwk.kid, TEST_UUID);
					assert.strictEqual(jwk.kty, 'EC');
					assert.strictEqual(jwk.use, 'sig');

					// no private values
					assert.strictEqual(jwk.d, undefined);
				});
			});
		}
	});

});
