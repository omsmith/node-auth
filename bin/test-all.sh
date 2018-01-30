#!/usr/bin/env bash

set -eu

source "$(dirname ${BASH_SOURCE[0]})/helpers.sh"

TOP_DIR=$(pwd)

for package in $(get_packages); do
	cd "${package}"
	npm test

	cd "${TOP_DIR}"
	if [ -d "${package}/.nyc_output" ]; then
		./node_modules/.bin/nyc \
			report \
			--temp-directory "${package}/.nyc_output" \
			--reporter lcov \
			--report-dir "coverage/$(basename "${package}")"
	fi
done
