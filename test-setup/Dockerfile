# syntax=docker/dockerfile:1
# The browsers (and so the snapshots) come from the Playwright image; the test
# runner uses the repository's Node version from .nvmrc, like CI.
FROM node:26.13.0-trixie-slim AS node
FROM mcr.microsoft.com/playwright:v1.62.1-noble
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -sf ../lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
 && ln -sf ../lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
COPY .nvmrc /tmp/.nvmrc
RUN test "$(node --version)" = "v$(cat /tmp/.nvmrc)" \
 || { echo "Node $(node --version) doesn't match .nvmrc ($(cat /tmp/.nvmrc)); update the node image above"; exit 1; }
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --include=dev
COPY . /workspace/
# The container runs as the host user (see docker-compose.yml): let it create and
# clear its own output folders in /workspace.
RUN chmod 777 /workspace
CMD [ \
  "sh", \
  "-c", \
  "if [ \"$UPDATE_SNAPSHOTS\" = \"true\" ]; then \
    echo 'Updating snapshots...' && \
    npx playwright test --update-snapshots -c ./playwright.config.ts; \
  else \
    echo 'Running tests...' && \
    npx playwright test -c ./playwright.config.ts;  \
  fi" \
]