'use strict';

const contexts = require('./contexts');

function BrightspaceAuthToken (source) {
	if (!(this instanceof BrightspaceAuthToken)) {
		return new BrightspaceAuthToken(source);
	}

	this._context = null;
	this._scope = null;

	this._source = source;
	this.tenant = source.tenantid;
	this.user = source.sub;
}

BrightspaceAuthToken.prototype.isGlobalContext = function isGlobalContext () {
	// calls getter
	return contexts.Global === this.context;
};

BrightspaceAuthToken.prototype.isTenantContext = function isTenantContext () {
	// calls getter
	return contexts.Tenant === this.context;
};

BrightspaceAuthToken.prototype.isUserContext = function isUserContext () {
	// calls getter
	return contexts.User === this.context;
};

Object.defineProperty(BrightspaceAuthToken.prototype, 'context', {
	get: function () {
		let context = this._context;
		if (null !== context) {
			return context;
		}

		if ('undefined' !== typeof this.user) {
			context = this._context = contexts.User;
		} else if ('undefined' !== typeof this.tenant) {
			context = this._context = contexts.Tenant;
		} else {
			context = this._context = contexts.Global;
		}

		return context;
	}
});

function hasPermissionInNarrow (narrow, permission) {
	return narrow.has('*') || narrow.has(permission);
}

function hasNarrowPermissionInBroad (broad, narrow, permission) {
	const wild = broad.get('*');
	if (!!wild && hasPermissionInNarrow(wild, permission)) {
		return true;
	}

	const permissions = broad.get(narrow);
	return !!permissions && hasPermissionInNarrow(permissions, permission);
}

BrightspaceAuthToken.prototype.hasScope = function hasScope (broad, narrow, permission) {
	// calls getter
	const scope = this.scope;

	const wild = scope.get('*');
	if (!!wild && hasNarrowPermissionInBroad(wild, narrow, permission)) {
		return true;
	}

	const narrows = scope.get(broad);
	return !!narrows && hasNarrowPermissionInBroad(narrows, narrow, permission);
};

Object.defineProperty(BrightspaceAuthToken.prototype, 'scope', {
	get: function () {
		let scope = this._scope;
		if (null !== scope) {
			return scope;
		}

		scope = this._scope = new Map();

		const scopeStrings = this._source.scope.replace(/https:\/\/api.brightspace.com\/auth\//g, '').split(' ');

		for (let scopeString of scopeStrings) {
			const scopeParts = scopeString.split(':');

			const
				broad = scopeParts[0],
				narrow = scopeParts[1],
				permissions = scopeParts[2].split('|');

			if (!scope.has(broad)) {
				scope.set(broad, new Map([[
					narrow,
					new Set(permissions)
				]]));
				continue;
			}

			const narrows = scope.get(broad);

			if (!narrows.has(narrow)) {
				narrows.set(narrow, new Set(permissions));
				continue;
			}

			const permissionSet = narrows.get(narrow);
			for (let permission of permissions) {
				permissionSet.add(permission);
			}
		}

		return scope;
	}
});

module.exports = BrightspaceAuthToken;
module.exports.contexts = contexts;
