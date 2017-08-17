#!/usr/bin/env bash

set -e

if [ "${TRAVIS_REPO_SLUG}" != "Brightspace/node-auth-keys" ]; then
	echo "Not building on Brightspace/node-auth-keys. Skipping..."
	exit 0
fi

if [ -z "${TRAVIS_TAG}" ]; then
	echo "Not a tag build. Skipping..."
	exit 0
fi

./bin/set-dependencies.js

for package in packages/node_modules/*/; do
	package=$(readlink -f "${package}")

	if [ ! -d "${package}" ]; then
		continue
	elif [ "true" = $(node --eval "console.log(require('${package}/package.json').private)") ]; then
		continue
	fi

	cd "${package}"

	if [ ! -z "${DRY_RUN}" ]; then
		echo "Dry run. Skipping..."
	else
		npm publish
	fi
done
