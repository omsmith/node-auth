#!/usr/bin/env bash

if [ -z "${TRAVIS_TAG}" ]; then
	exit 0;
fi

set -u

KEY="${encrypted_5390d14040b7_key}"
IV="${encrypted_5390d14040b7_iv}"

NPMRC=$( readlink -f ~/.npmrc )
NPMRC_TMP=$( readlink -f ~/.npmrc.tmp )
NPMRC_ENC=".npmrc.rw-travisci-npm.enc"

mv "${NPMRC}" "${NPMRC_TMP}" &> /dev/null
openssl aes-256-cbc -K "${KEY}" -iv "${IV}" -in "${NPMRC_ENC}" -out "${NPMRC}" -d && npm publish
rm "${NPMRC}" &> /dev/null
mv "${NPMRC_TMP}" "${NPMRC}" &> /dev/null
