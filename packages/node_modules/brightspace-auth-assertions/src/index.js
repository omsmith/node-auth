'use strict';

const inherits = require('inherits');

const contexts = {
	user: Symbol('ContextAssertion.User'),
	tenant: Symbol('ContextAssertion.Tenant'),
	global: Symbol('ContextAssertion.MultiTenant')
};

function AssertionCompiler () {
	if (!(this instanceof AssertionCompiler)) {
		return new AssertionCompiler();
	}

	this._assertions = [];
}

AssertionCompiler.prototype.scope = function addScopeAssertion (broad, narrow, permission) {
	const assertion = new ScopeAssertion(this, broad, narrow, permission);
	return assertion;
};

AssertionCompiler.prototype.context = function addContextAssertion (context) {
	const assertion = new ContextAssertion(this, context);
	return assertion;
};

AssertionCompiler.prototype.compile = function compileAssertions () {
	const assertions = this._assertions.slice();
	return function compiledAassertion (token) {
		for (let assertion of assertions) {
			assertion.assert(token);
		}
	};
};

module.exports = AssertionCompiler;
module.exports.contexts = contexts;

function AuthAssertion (compiler) {
	if (!(this instanceof AuthAssertion)) {
		return new AuthAssertion(compiler);
	}

	if (!(compiler instanceof AssertionCompiler)) {
		throw new Error();
	}

	this._compiler = compiler;
	this._require = false;
	this._reject = false;
}

AuthAssertion.prototype._inject = function injectAssertion () {
	this._compiler._assertions.push(this);

	return this._compiler;
};

AuthAssertion.prototype.require = function requireAssertion () {
	this._require = true;

	return this._inject();
};

AuthAssertion.prototype.reject = function rejectAssertion () {
	this._reject = true;

	return this._inject();
};

AuthAssertion.prototype.assert = function assertAssertion (token) {
	if ('function' === typeof this._assert) {
		this._assert(token);
	}
};

function ScopeAssertion (compiler, broad, narrow, permission) {
	AuthAssertion.call(this, compiler);

	this.broad = broad;
	this.narrow = narrow;
	this.permission = permission;
}
inherits(ScopeAssertion, AuthAssertion);

ScopeAssertion.prototype._assert = function assertScope (token) {
	let matched = false;

	const scopeStrings = token.scope.replace(/https:\/\/api.brightspace.com\/auth\//g, '').split(' ');

	for (let scopeString of scopeStrings) {
		const scopeParts = scopeString.split(':');

		const
			broad = scopeParts[0],
			narrow = scopeParts[1];

		const broadMatched = '*' === broad || this.broad === broad;
		if (this._require && !broadMatched) {
			continue;
		}

		const narrowMatched = '*' === narrow || this.narrow === narrow;
		if (this._require && !narrowMatched) {
			continue;
		}

		const permissions = scopeParts[2].split('|');

		for (let permission of permissions) {
			const permissionMatched = '*' === permission || this.permission === permission;

			if (permissionMatched) {
				matched = true;
				break;
			}
		}
	}

	if (this._require && !matched) {
		throw new Error('Insufficient scope');
	}

	if (this._reject && matched) {
		throw new Error('Too much scope');
	}
};

function ContextAssertion (compiler, context) {
	AuthAssertion.call(this, compiler);

	this.context = context;
}
inherits(ContextAssertion, AuthAssertion);

ContextAssertion.prototype._assert = function assertContext (token) {
	let matched = false;

	const
		hasUser = 'string' === typeof token.sub,
		hasTenant = 'string' === typeof token.tenantid;

	switch (this.context) {
		case contexts.user: {
			matched = hasUser && hasTenant;
			break;
		}
		case contexts.tenant: {
			matched = !hasUser && hasTenant;
			break;
		}
		case contexts.global: {
			matched = !hasUser && !hasTenant;
			break;
		}
	}

	if ((this._require && !matched) || (this._reject && matched)) {
		throw new Error('Invalid Context');
	}
};


