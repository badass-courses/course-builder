#!/usr/bin/env bash

MODE=${1:-run}

if [[ "$MODE" == "run" || "$MODE" == "watch" ]]; then
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

  echo "Waiting 10s for db to start..." && sleep 30

  # Push schema and seed
  NODE_OPTIONS='--import tsx' drizzle-kit generate:mysql --config=./test/mysql/drizzle.config.ts
  NODE_OPTIONS='--import tsx' drizzle-kit push:mysql --config=./test/mysql/drizzle.config.ts

  if [[ "$MODE" == "run" ]]; then
    if vitest run -c ../utils/vitest.config.ts ./test/mysql/index.test.ts; then
      docker stop ${MYSQL_CONTAINER_NAME}
    else
      docker stop ${MYSQL_CONTAINER_NAME} && exit 1
    fi
  elif [[ "$MODE" == "watch" ]]; then
    if vitest watch -c ../utils/vitest.config.ts ./test/mysql/index.test.ts; then
      docker stop ${MYSQL_CONTAINER_NAME}
    else
      docker stop ${MYSQL_CONTAINER_NAME} && exit 1
    fi
  fi
else
  echo "Usage: $0 [run|watch]"
  exit 1
fi
