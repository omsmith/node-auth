#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const COMMON_META = [
	'author',
	'bugs',
	'homepage',
	'license',
	'repository'
];

const topPkgDir = path.resolve(__dirname, '..');
const topPkg = JSON.parse(fs.readFileSync(path.join(topPkgDir, 'package.json'), 'utf8'));

const pkgsDir = path.join(topPkgDir, 'packages/node_modules');
const pkgNames = fs.readdirSync(pkgsDir);

for (const pkgName of pkgNames) {
	const pkgDir = path.join(pkgsDir, pkgName);
	const pkgPath = path.join(pkgDir, 'package.json');
	const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

	for (const field of COMMON_META) {
		pkg[field] = topPkg[field];
	}

	fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '  ') + '\n', 'utf8');
}
