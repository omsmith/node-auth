# brightspace-auth-token
[![Build Status](https://travis-ci.com/Brightspace/node-auth-token.svg?token=M9m6audKHodN5pA44rGq&branch=master)](https://travis-ci.com/Brightspace/node-auth-token)

## Usage

```js
const AuthToken = require('brightspace-auth-token');

function *authMiddleware (next) {
	const jwtSignature = this.headers.authorization; // or cookies
	const validatedJwtPayload = yield things(jwtSignature);

	const token = new AuthToken(vanillaPayload, jwtSignature);

	this.auth = token;

	yield* next;
};

// ...

function *handleReq () {
	if (this.auth.hasScope('valence', 'apps', 'manage')) {
		// things so hard
	}

	if (this.auth.isUserContext()) {
		// this token is for a user
	}
}
```

### API

---

#### `new AuthToken(Object decodedPayload, String source)` -> `AuthToken`

_decodedPayload_ should be an already verified and parsed JWT body. _source_
should be the signature from which the payload was retrieved.

___

#### `.isGlobalContext()` -> `Boolean`

___

#### `.isTenantContext()` -> `Boolean`

---

#### `.isUserContext()` -> `Boolean`

---

#### `.context` -> `Symbol`

___

#### `.hasScope(String group, String resource, String permission)` -> `Boolean`

---

#### `.scope` -> `Map`

---

#### `.cacheKey` -> `String`

A normalized string which could be used as part of cache keys when caching
resources.


## Testing

```bash
npm test
```

## Contributing

1. **Fork** the repository. Committing directly against this repository is
   highly discouraged.

2. Make your modifications in a branch, updating and writing new unit tests
   as necessary in the `spec` directory.

3. Ensure that all tests pass with `npm test`

4. `rebase` your changes against master. *Do not merge*.

5. Submit a pull request to this repository. Wait for tests to run and someone
   to chime in.

### Code Style

This repository is configured with [EditorConfig][EditorConfig] and
[ESLint][ESLint] rules.

[EditorConfig]: http://editorconfig.org/
[ESLint]: http://eslint.org
