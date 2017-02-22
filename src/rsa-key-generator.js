'use strict';

const assert = require('assert');
const jwkToPem = require('jwk-to-pem');
const generate = require('native-crypto/generate');

function keygen(size, kid) {
	return generate('RS256', size)
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
module.exports.validate = function(signingKeySize) {
	assert(signingKeySize > 0, 'signingKeySize must be positive');
};
