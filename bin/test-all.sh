#!/usr/bin/env bash

DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
NODE_BIN=$(readlink -f "${DIRNAME}/../node_modules/.bin")

run_tests () {
	local package="${1}"; shift

	package=$(readlink -f "${package}")

	cd "${package}"
	npm test
}

for package in packages/node_modules/*/; do [ -d "${package}" ] && run_tests "${package}"; done
