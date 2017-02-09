'use strict';

const base64url = require('base64-url').escape;
const elliptic = require('elliptic');
const jwkToPem = require('jwk-to-pem');

function b64(val, zero) {
	var buf = new Buffer(val.toString('hex', 2), 'hex');
	val = base64url(buf.toString('base64'));
	if (zero) {
		buf.fill(0);
	}
	return val;
}

function crvToEc(crv) {
	switch (crv) {
		case 'P-256': {
			return elliptic.ec('p256');
		}
		case 'P-384': {
			return elliptic.ec('p384');
		}
		case 'P-521': {
			return elliptic.ec('p521');
		}
		default: {
			throw new Error(`Unknown curve: "${crv}". Must be one of "P-256", "P-384", "P-521"`);
		}
	}
}

function keygen(crv, kid) {
	const keypair = crvToEc(crv).genKeyPair();

	const priv = keypair.getPrivate();
	const pub = keypair.getPublic();

	const jwk = {
		kid,
		use: 'sig',
		kty: 'EC',
		crv,
		x: b64(pub.getX(), false),
		y: b64(pub.getY(), false),
		d: b64(priv, true)
	};

	const pem = jwkToPem(jwk, { private: true });

	jwk.d = undefined;

	return {
		jwk,
		pem
	};
}

module.exports = keygen;
module.exports.validate = crvToEc;
