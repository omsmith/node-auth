# brightspace-auth-jwks

Library for generating, storing, and retrieving keypairs for use in
Brightspace's auth framework.

## Install
```bash
npm install brightspace-auth-jwks --save
```

## Usage

**Step 1**. Implement the interface defined by `AbstractPublicKeyStore`:

```javascript
const AbstractPublicKeyStore = require('brightspace-auth-jwks').AbstractPublicKeyStore;

class RedisPublicKeyStore extends AbstractPublicKeyStore {
	constructor (redisClient) {
		super();
		// initialization
	}

	_storePublicKey (key, expiry) {
		// "key" is an opaque String representing the public JWK
		// "expiry" is the "seconds since unix epoch", after which
		// the key should not longer be returned in results

		// returns a Promise, resolving after the key is successfully stored
	}

	_lookupPublicKeys() {
		// returns a Promise, resolving with an Array of the stored opaque strings
	}
}
```

**Step 2**. Instantiate `KeyGenerator`:

```javascript
const KeyGenerator = require('brightspace-auth-jwks').KeyGenerator;
const publicKeyStore = new RedisPublicKeyStore(...);

const keyGenerator = new KeyGenerator({
	signingKeyType: 'EC',
	// other settings
	publicKeyStore
});
```

**Step 3**. Expose a route for public key retrieval using a routing framework
of your choice. The route will be called by D2L Auth Service. Note that your
service must be known by the Auth service (present in its DB).

```javascript

const router = require('koa-router')();

router.get('/auth/.well-known/jwks', function() {
	return publicKeyStore
		.lookupPublicKeys()
		.then(keys => this.body = { keys });
});

router.get('/auth/jwk/:kid', function(kid) {
	return publicKeyStore
		.lookupPublicKey(kid)
		.then(key => this.body = key);
});

app.use(router.routes());

```
**Step 4**. Instantiate [AuthTokenProvisioner][AuthTokenProvisioner] providing
`keyGenerator.getCurrentPrivateKey` as a `keyLookup` function:

```javascript
const AuthTokenProvisioner = require('brightspace-auth-provisioning');

const provisioner = new AuthTokenProvisioner({
	...
	keyLookup: keyGenerator.getCurrentPrivateKey.bind(keyGenerator),
	...
});
```
Now you are able to call `provisioner.provisionToken(...)`.

## Supported options:

```javascript
const keyGenerator = new KeyGenerator({
	signingKeyType: 'EC',				// A type of signing keys to generate. 'RSA' or 'EC'. REQUIRED
	signingKeyAge: 3600,				// Length of time, in seconds, for a private key to remain in use
	signingKeyOverlap: 300,				// Length of time, in seconds, for a public key to remain valid
										// after its private key has been rotated out. This is effectively
										// the maximum lifetime of a signed token.

	// RSA-specific settings:
	rsa: {
		signingKeySize: 2048			// RSA key size, in bits
	},

	// EC-specific settings:
	ec: {
		crv: 'P-256'					// one of 'P-256', 'P-384', 'P-521'
	},

	publicKeyStore: new RedisPublicKeyStore(...)	// A backend for storing public keys.
													// Can be anything: Redis, MSSQL, PostgreSQL, etc.
													// See "node-auth-provisioning-postgresql" for
													// the PostgreSQL backed.
													// REQUIRED
});
```

## Contributing

1. **Fork** the repository. Committing directly against this repository is
   highly discouraged.

2. Make your modifications in a branch, updating and writing new unit tests
   as necessary in the `test` directory.

3. Ensure that all tests pass with `npm test`

4. `rebase` your changes against master. *Do not merge*.

5. Submit a pull request to this repository. Wait for tests to run and someone
   to chime in.

### Code Style

This repository is configured with [EditorConfig][EditorConfig] and
[ESLint][ESLint] rules.

[AuthTokenProvisioner]: https://github.com/Brightspace/node-auth-provisioning
[EditorConfig]: http://editorconfig.org/
[ESLint]: http://eslint.org
