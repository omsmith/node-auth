# brightspace-auth-token
[![Build Status](https://travis-ci.com/Brightspace/node-auth-token.svg?token=M9m6audKHodN5pA44rGq&branch=master)](https://travis-ci.com/Brightspace/node-auth-token)

## Usage

```js
const AuthToken = require('brightspace-auth-token');

// See brightspace-auth-validation to do this for you!
function authorizeRequest(req) {
	const signature = req.headers.authorization.match(/Bearer (.+)/)[1];
	const payload = parseAndValidateSignature(signature);

	return new AuthToken(payload, signature);
}

require('http')
	.createServer((req, res) => {
		const token = authorizeRequest(req);

		if (!token.hasScope('random', 'greetings', 'read')) {
			res.statusCode = 403;
			res.end('You don\'t have sufficient scope!\n');
			return;
		}

		let msg;
		if (token.isUserContext()) {
			msg = 'Hello user!\n';
		} else if (token.isTenantContext()) {
			msg = 'Hello service, acting at the tenant level!\n';
		} else if (token.isGlobalContext()) {
			msg = 'Hello service, maintaining all of our systems!\n';
		}

		res.statusCode = 200;
		res.end(msg);
	})
	.listen(3000);

```

### API

---

#### `new AuthToken(Object decodedPayload, String source)` -> `AuthToken`

_decodedPayload_ should be an already verified and parsed JWT body. _source_
should be the signature from which the payload was retrieved.

---

#### `.user` -> `String|Undefined`

The identifier for the user this token belongs to. Not present outside of user
context.

---

#### `.tenant` -> `String|Undefined`

The tenant UUID this token belongs to. Not present outside of user and tenant
contexts.

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

---

#### `.source` -> `String`

The source signature provider when creating the token.


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
