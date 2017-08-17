'use strict';

const jwkToPem = require('jwk-to-pem');
const generate = require('native-crypto/generate');

const DEFAULT_CRV = 'P-256';

const CRV_TO_ALG = {
	'P-256': 'ES256',
	'P-384': 'ES384',
	'P-521': 'ES512'
};

function keygen(opts, kid) {
	return generate(opts.crv)
		.then(keypair => {
			return Promise
				.all([
					keypair.publicKey,
					jwkToPem(keypair.privateKey, { private: true })
				]);
		})
		.then(res => {
			return {
				jwk: {
					kid,
					kty: res[0].kty,
					crv: res[0].crv,
					x: res[0].x,
					y: res[0].y,
					alg: CRV_TO_ALG[opts.crv],
					use: 'sig'
				},
				signingKey: {
					kid,
					pem: res[1],
					alg: CRV_TO_ALG[opts.crv]
				}
			};
		});
}

module.exports = keygen;
module.exports.normalize = function normalize(opts) {
	if (opts && typeof opts.crv !== 'undefined') {
		const crv = opts.crv;

		if (typeof crv !== 'string') {
			throw new TypeError(`"opts.ec.crv" should be a String. Got "${typeof crv}".`);
		}

		if (!CRV_TO_ALG[crv]) {
			throw new Error(`"opts.ec.crv" must be on of ${Object.keys(CRV_TO_ALG)}. Got "${crv}".`);
		}

		return { crv };
	}

	return { crv: DEFAULT_CRV };
};
