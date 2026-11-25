#!/bin/sh

set -u
export UPDATE_SNAPSHOTS="${UPDATE_SNAPSHOTS:-false}"
node scripts/check-docker.mjs || exit $?
# Run the container as you, and create the mounted folders first (Docker
# would otherwise create missing ones owned by root).
export HOST_UID="$(id -u)" HOST_GID="$(id -g)"
mkdir -p test-results playwright-report
# Test runs from before this change ran as root and left root-owned files.
if [ "$HOST_UID" != 0 ] && [ -n "$(find test-setup/.cache src test-results playwright-report ! -user "$HOST_UID" -print -quit 2>/dev/null)" ]; then
  echo "Earlier test runs left files owned by root, which this run can't update. Fix once with:"
  echo "  sudo chown -R $HOST_UID:$HOST_GID test-setup/.cache src test-results playwright-report"
  exit 1
fi
echo "Starting Docker Compose..."
[ "$UPDATE_SNAPSHOTS" = "true" ] && echo "⚠️ UPDATING SNAPSHOTS! "
# Start Docker Compose with options to abort on container exit and use the exit code from the 'test' service
UPDATE_SNAPSHOTS=$UPDATE_SNAPSHOTS docker compose -f=./test-setup/docker-compose.yml up --build --abort-on-container-exit --exit-code-from playwright-tests
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "Tests failed. Inspect the report with:"
  echo "  npm run show-report"
  echo ""
  echo "HTML report path: ./playwright-report/index.html"
fi

exit $EXIT_CODE
