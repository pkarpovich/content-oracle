ARG NODE_VERSION=22.16

FROM node:${NODE_VERSION}-alpine as base

ARG PNPM_VERSION=9.15

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM base AS dependencies

COPY package.json pnpm-lock.yaml* ./
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm fetch
RUN pnpm install --offline --frozen-lockfile

FROM dependencies AS builder

COPY . .
RUN pnpm run build

FROM ghcr.io/pkarpovich/env-driven-static-server:latest

COPY --from=builder /app/dist/ /public