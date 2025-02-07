#!/bin/sh

echo "Building the site..."

if [ "$INCOMING_HOOK_BODY" = '{"skipCache":true}' ]; then
  echo "This build was triggered by a Sanity update. Skipping the Nx cache."
  nx run www-v2:build --skip-nx-cache
else
  nx run www-v2:build
fi;

exit $?
