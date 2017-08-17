#!/usr/bin/env node

'use strict';

const findRequires = require('find-requires');
const fs = require('fs');
const path = require('path');

const topPkgDir = path.resolve(__dirname, '..');
const topPkg = JSON.parse(fs.readFileSync(path.join(topPkgDir, 'package.json'), 'utf8'));
const definedDependencies = Object.keys(topPkg.dependencies);

const pkgsDir = path.join(topPkgDir, 'packages/node_modules');
const pkgNames = fs.readdirSync(pkgsDir);

for (const pkgName of pkgNames) {
	const pkgDir = path.join(pkgsDir, pkgName);
	const pkgPath = path.join(pkgDir, 'package.json');
	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	const main = pkg.main || 'index.js';
	const mainPath = path.join(pkgDir, main);

	/**
	 * Dependency Detection
	 *
	 * Caveats:
	 *
	 * 1. Assumes library is requirable without side-effects, which it should be
	 * 2. Doesn't allow for coniditional requires or anything in that realm
	 * 3. Assumes single entry-point
	 *
	 * Benefits:
	 *
	 * 1. Doesn't assume location of script files?
	 *
	 * A better approach might be to look at "files" in package.json
	 */
	for (const key of Object.keys(require.cache)) {
		delete require.cache[key];
	}
	require(mainPath);

	const modulesInPackage = Object
		.keys(require.cache)
		.filter(id => id.startsWith(pkgDir + '/'));
	const requiresInPackage = Array.prototype.concat.apply(
		[],
		modulesInPackage.map(m => findRequires(fs.readFileSync(m, 'utf8')))
	);
	const packageRequires = requiresInPackage
		.filter(id => id[0] !== '.' && id[0] !== '/')
		.map(id => {
			const slash = id.indexOf('/');
			if (slash === -1) {
				return id;
			}

			return id.slice(0, slash);
		});

	const externalDependencies = intersect(packageRequires, definedDependencies).sort();
	const internalDependencies = intersect(packageRequires, pkgNames).sort();

	pkg.dependencies = {};

	for (const dep of externalDependencies) {
		pkg.dependencies[dep] = topPkg.dependencies[dep];
	}
	for (const dep of internalDependencies) {
		pkg.dependencies[dep] = topPkg.version;
	}

	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '  ') + '\n', 'utf8');
}

function intersect(a, b) {
	a = new Set(a);
	b = new Set(b);
	return Array.from(a).filter(x => b.has(x));
}
