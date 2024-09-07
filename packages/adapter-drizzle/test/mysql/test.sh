#!/usr/bin/env bash

MODE=${1:-run}

if [[ "$MODE" == "run" || "$MODE" == "watch" ]]; then
  echo "Initializing container for MySQL tests."

  MYSQL_DATABASE=coursebuilder
  MYSQL_ROOT_PASSWORD=password
  MYSQL_CONTAINER_NAME=coursebuilder-mysql-test

  echo "Starting MySQL container..."
  docker run -d --rm \
    -e MYSQL_DATABASE=${MYSQL_DATABASE} \
    -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
    --name "${MYSQL_CONTAINER_NAME}" \
    -p 3306:3306 \
    mysql:8.0.37

  echo "Waiting for the database to be ready..."
  while ! docker exec ${MYSQL_CONTAINER_NAME} mysqladmin ping -h localhost --silent; do
    sleep 1
  done
  sleep 1
  echo "Database is ready."

  echo "Generating MySQL schema..."
  NODE_OPTIONS='--import tsx' drizzle-kit generate mysql --config=./test/mysql/drizzle.config.ts

  echo "Pushing MySQL schema..."
  NODE_OPTIONS='--import tsx' drizzle-kit push mysql --config=./test/mysql/drizzle.config.ts

  if [[ "$MODE" == "run" ]]; then
    echo "Running tests..."
    if vitest run -c ../utils/vitest.config.ts ./test/mysql/index.test.ts; then
      echo "Tests passed. Stopping MySQL container..."
      docker stop ${MYSQL_CONTAINER_NAME}
    else
      echo "Tests failed. Stopping MySQL container..."
      docker stop ${MYSQL_CONTAINER_NAME} && exit 1
    fi
  elif [[ "$MODE" == "watch" ]]; then
    echo "Running tests in watch mode..."
    if vitest watch -c ../utils/vitest.config.ts ./test/mysql/index.test.ts; then
      echo "Watch mode exited. Stopping MySQL container..."
      docker stop ${MYSQL_CONTAINER_NAME}
    else
      echo "Watch mode exited with an error. Stopping MySQL container..."
      docker stop ${MYSQL_CONTAINER_NAME} && exit 1
    fi
  fi
else
  echo "Usage: $0 [run|watch]"
  exit 1
fi
