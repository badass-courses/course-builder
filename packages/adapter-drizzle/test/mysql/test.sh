#!/usr/bin/env bash

echo "Initializing container for MySQL tests."

MYSQL_DATABASE=coursebuilder
MYSQL_ROOT_PASSWORD=password
MYSQL_CONTAINER_NAME=coursebuilder-mysql-test

docker run -d --rm \
  -e MYSQL_DATABASE=${MYSQL_DATABASE} \
  -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
  --name "${MYSQL_CONTAINER_NAME}" \
  -p 3306:3306 \
  mysql:8 \
  --default-authentication-plugin=mysql_native_password

echo "Waiting 10s for db to start..." && sleep 10

# Push schema and seed
NODE_OPTIONS='--import tsx' drizzle-kit generate:mysql --config=./test/mysql/drizzle.config.ts
NODE_OPTIONS='--import tsx' drizzle-kit push:mysql --config=./test/mysql/drizzle.config.ts

if vitest run -c ../utils/vitest.config.ts ./test/mysql/index.test.ts; then
  docker stop ${MYSQL_CONTAINER_NAME}
else
  docker stop ${MYSQL_CONTAINER_NAME} && exit 1
fi
