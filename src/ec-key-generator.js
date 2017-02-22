'use strict';

const jwkToPem = require('jwk-to-pem');
const generate = require('native-crypto/generate');

const CRV_TO_ALG = {
	'P-256': 'ES256',
	'P-384': 'ES384',
	'P-521': 'ES512'
};

function keygen(crv, kid) {
	return generate(crv)
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
					alg: CRV_TO_ALG[crv],
					use: 'sig'
				},
				signingKey: {
					kid,
					pem: res[1],
					alg: CRV_TO_ALG[crv]
				}
			};
		});
}

module.exports = keygen;
module.exports.validate = crv => {
	if (!CRV_TO_ALG[crv]) {
		throw new Error(`Unknown curve: "${crv}". Must be one of "P-256", "P-384", "P-521"`);
	}
};
