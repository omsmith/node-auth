'use strict';

const jwkToPem = require('jwk-to-pem');
const generate = require('native-crypto/generate');

const DEFAULT_SIZE = 2048;
const MINIMUM_SIZE = 2048;

function keygen(opts, kid) {
	return generate('RS256', opts.size)
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
					n: res[0].n,
					e: res[0].e,
					alg: 'RS256',
					use: 'sig'
				},
				signingKey: {
					kid,
					pem: res[1],
					alg: 'RS256'
				}
			};
		});
}

module.exports = keygen;
module.exports.normalize = function normalize(opts) {
	if (opts && typeof opts.signingKeySize !== 'undefined') {
		const size = opts.signingKeySize;

		if (typeof size !== 'number') {
			throw new TypeError(`"opts.rsa.signingKeySize" should be a Number. Got "${typeof size}".`);
		}

		if (size !== Math.round(size)) {
			throw new TypeError(`"opts.rsa.signingKeySize" should be an integer. Got "${size}".`);
		}

		if (size < MINIMUM_SIZE) {
			throw new Error(`"opts.rsa.signingKeySize" must be atleast ${MINIMUM_SIZE}. Got "${size}".`);
		}

		return { size };
	}

	return { size: DEFAULT_SIZE };
};
