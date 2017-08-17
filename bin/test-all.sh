#!/usr/bin/env bash

DIRNAME="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT=$(readlink -f "${DIRNAME}/..")
NODE_BIN=$(readlink -f "${ROOT}/node_modules/.bin")

run_tests () {
	local root="${1}"; shift
	local package="${1}"; shift

	cd "${package}"
	npm test
	cd "${root}"
}

for package in packages/node_modules/*/; do
	package=$(readlink -f "${package}")
	if [ ! -d "${package}" ]; then
		continue
	fi

	run_tests "${ROOT}" "${package}"
done
