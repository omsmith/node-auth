'use strict';

const
	AuthToken = require('@d2l/brightspace-auth-token'),
	inherits = require('inherits');

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
	let matched = token.hasScope(this.broad, this.narrow, this.permission);

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

	switch (this.context) {
		case AuthToken.contexts.User: {
			matched = token.isUserContext();
			break;
		}
		case AuthToken.contexts.Tenant: {
			matched = token.isTenantContext();
			break;
		}
		case AuthToken.contexts.Global: {
			matched = token.isGlobalContext();
			break;
		}
	}

	if ((this._require && !matched) || (this._reject && matched)) {
		throw new Error('Invalid Context');
	}
};

module.exports = AssertionCompiler;
module.exports.contexts = AuthToken.contexts;
