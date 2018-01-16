#!/usr/bin/env bash

set -eu

source "$(dirname ${BASH_SOURCE[0]})/helpers.sh"

for package in $(get_packages); do
	cd "${package}"
	npm test
done
