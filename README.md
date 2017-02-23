# node-auth-jwks

Key generation/storage/retrieval logic.
Initial version extracted from https://github.com/Brightspace/valence-auth-server originally written by Owen Smith.

## Roadmap
- [x] Core key generation/storage/retrieval logic
- [x] RSA keys
- [x] ECDSA keys
- [ ] Continuous integration testing (TravisCI?)

## Usage

**Step 1**. Implement the interface defined by `AbstractPublicKeyStore`:

```javascript
const AbstractPublicKeyStore = require('node-auth-jwks').AbstractPublicKeyStore;

class RedisPublicKeyStore extends AbstractPublicKeyStore {
	constructor (redisClient) {
		super();
		// initialization
	}

	_storePublicKey (key, expiry) {
		// returns a Promise
	}

	_lookupPublicKeys() {
		// returns a Promise wrapping all non-expired public keys
	}
}
```

**Step 2**. Instantiate `KeyGenerator`:

```javascript
const NodeAuthJwks = require('node-auth-jwks');
const publicKeyStore = new RedisPublicKeyStore(...);

const keyGenerator = new NodeAuthJwks.KeyGenerator({
	signingKeyType: 'RSA',
	// other settings
	publicKeyStore
});
```

**Step 3**. Expose a route for public key retrieval using a routing framework
of your choice. The route will be called by D2L Auth Service. Note that your service must be known by the Auth service (present in its DB).

```javascript

const router = require('koa-router')();

router.get('/auth/.well-known/jwks', function() {
	return publicKeyStore
		.lookupPublicKeys()
		.then(keys => this.body = { keys });
});

app.use(router.routes());

```
**Step 4**. Instantiate `NodeAuthProvisioner`
(https://github.com/Brightspace/node-auth-provisioning) providing
`keyGenerator.getCurrentPrivateKey` as a `keyLookup` function:

```javascript
const
	AuthTokenProvisioner = require('@d2l/brightspace-auth-provisioning');

const provisioner = new AuthTokenProvisioner({
	...
	keyLookup: keyGenerator.getCurrentPrivateKey.bind(keyGenerator),
	...
});
```
Now you are able to call `provisioner.provisionToken(...)`.

## Supported options:

```javascript
const keyGenerator = new NodeAuthJwks.KeyGenerator({
	signingKeyType: 'RSA',				// A type of signing keys to generate. 'RSA' or 'EC'
	signingKeyAge: <integer, sec>,		// For how long a generated pair of private/public keys remains active
										// Inactive keys expire, and a new key pair is generated
										// Default: 1 hour
	signingKeyOverlap: <integer, sec>,	// An additional overlap period for an old public key to remain active
										// Default: 5 mins

	// RSA-specific settings:
	rsa: {
		signingKeySize: <integer, bits>	// A size of an RSA key to generate. Default: 1024 bits
	},

	// EC-specific settings:
	ec: {
		crv: <String> // one of 'P-256', 'P-384', 'P-521'
	},

	publicKeyStore: new RedisPublicKeyStore(...)	// A backend for storing public keys.
													// Can be anything: Redis, MSSQL, PostgreSQL, etc.
													// See "node-auth-provisioning-postgresql" for
													// the PostgreSQL backed.
});
```
