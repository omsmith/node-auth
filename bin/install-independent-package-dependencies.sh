#!/usr/bin/env bash

set -eu

get_directories() {
	parent="${1}"; shift

	find "${parent}" -maxdepth 1 -not -path "${parent}" -type d | xargs -n1 readlink -f
}

for package in $(get_directories packages/node_modules); do
	cd "${package}"

	npm install
done
