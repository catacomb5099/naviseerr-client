# Two stages: Node builds the app, then a small Caddy image serves the built files and forwards
# /api/* to the naviseerr server (see Caddyfile). Node and the sources never reach the final image.
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
# Optional extra root CAs (certs/*.pem, gitignored) for building behind a TLS-intercepting proxy.
# No .pem in the folder = Node's normal trust store. Same idea as ytmusic-adapter's Dockerfile.
COPY certs/ ./certs/
RUN cat certs/*.pem > /tmp/extra-ca.pem 2>/dev/null; \
    if [ -s /tmp/extra-ca.pem ]; then export NODE_EXTRA_CA_CERTS=/tmp/extra-ca.pem; fi; \
    npm ci

COPY . .
# Vite bakes this into the app at build time. Relative, so the browser calls the same address it
# loaded the app from, and one image works on any host and port.
ARG VITE_API_URL=/api
RUN npm run build

FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
EXPOSE 80
# `docker compose ps` says "healthy" once Caddy serves the app; before this the web app was the one
# part of the all-in-one install with no health state. BusyBox wget, so nothing extra is installed.
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost/ >/dev/null || exit 1
