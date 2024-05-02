#!/usr/bin/env bash

set -e

MODE=${1:-run}

if [[ "$MODE" == "run" || "$MODE" == "watch" ]]; then
  echo "Initializing container for MySQL tests."

  MYSQL_DATABASE=coursebuilder
  MYSQL_ROOT_PASSWORD=password
  MYSQL_CONTAINER_NAME=coursebuilder-mysql-test

  echo "Starting MySQL container..."
	docker run -d \
	 -e MYSQL_DATABASE=${MYSQL_DATABASE} \
	 -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
	 --name "${MYSQL_CONTAINER_NAME}" \
	 -p ${MYSQL_PORT}:3306 \
	 --detach-keys "ctrl-c" \
	 mysql:8

  echo "Waiting for MySQL container to start..."
  WAIT_TIMEOUT=120
  WAIT_INTERVAL=5
  WAIT_ELAPSED=0
  while ! docker exec -i ${MYSQL_CONTAINER_NAME} mysql --user=root --password=${MYSQL_ROOT_PASSWORD} -e "SELECT 1" >/dev/null 2>&1; do
    if [ ${WAIT_ELAPSED} -ge ${WAIT_TIMEOUT} ]; then
      echo "Timed out waiting for MySQL container to start"
      echo "MySQL container logs:"
      docker logs ${MYSQL_CONTAINER_NAME}
      echo "Docker container status:"
      docker ps -a
      echo "Docker container inspection:"
      docker inspect ${MYSQL_CONTAINER_NAME}
      exit 1
    fi
    echo "Waiting for MySQL container to start... (${WAIT_ELAPSED}s elapsed)"
    sleep ${WAIT_INTERVAL}
    WAIT_ELAPSED=$((WAIT_ELAPSED + WAIT_INTERVAL))
  done
  echo "MySQL container started successfully"

  echo "Generating and pushing MySQL schema..."
  NODE_OPTIONS='--import tsx' drizzle-kit generate:mysql --config=./test/mysql/drizzle.config.ts
  NODE_OPTIONS='--import tsx' drizzle-kit push:mysql --config=./test/mysql/drizzle.config.ts

  if [[ "$MODE" == "run" ]]; then
    echo "Running tests..."
    if vitest run -c ../utils/vitest.config.ts ./test/mysql/index.test.ts; then
      echo "Tests passed"
    else
      echo "Tests failed"
      docker logs ${MYSQL_CONTAINER_NAME}
      exit 1
    fi
  elif [[ "$MODE" == "watch" ]]; then
    echo "Watching tests..."
    if vitest watch -c ../utils/vitest.config.ts ./test/mysql/index.test.ts; then
      echo "Watch mode exited"
    else
      echo "Watch mode failed"
      docker logs ${MYSQL_CONTAINER_NAME}
      exit 1
    fi
  fi

  echo "Stopping MySQL container..."
  docker stop ${MYSQL_CONTAINER_NAME}
else
  echo "Usage: $0 [run|watch]"
  exit 1
fi
