#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const topPkgDir = path.resolve(__dirname, '..');
const topPkg = JSON.parse(fs.readFileSync(path.join(topPkgDir, 'package.json'), 'utf8'));
const topPkgNodeModules = path.join(topPkgDir, 'node_modules');
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

	const loadedExternalModules = Object
		.keys(require.cache)
		.filter(id => id.startsWith(topPkgNodeModules));
	const loadedInternalModules = Object
		.keys(require.cache)
		.filter(id => id.startsWith(pkgsDir) && !id.startsWith(pkgDir + '/'));

	const loadedExternalPackages = modulesToPackages(loadedExternalModules, topPkgNodeModules);
	const loadedInternalPackages = modulesToPackages(loadedInternalModules, pkgsDir);

	const externalDependencies = intersect(loadedExternalPackages, definedDependencies);
	const internalDependencies = loadedInternalPackages;

	pkg.dependencies = {};

	for (const dep of externalDependencies) {
		pkg.dependencies[dep] = topPkg.dependencies[dep];
	}
	for (const dep of internalDependencies) {
		pkg.dependencies[dep] = topPkg.version;
	}

	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '  ') + '\n', 'utf8');
}

function moduleToPackage(module, packagesRoot) {
	module = module.slice(packagesRoot.length + 1);
	module = module.slice(0, module.indexOf('/'));

	return module;
}

function modulesToPackages(modules, packagesRoot) {
	return Array.from(new Set(modules.map(m => moduleToPackage(m, packagesRoot)))).sort();
}

function intersect(a, b) {
	b = new Set(b);
	return a.filter(x => b.has(x));
}
