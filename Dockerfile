FROM oven/bun:1.3.3

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY config ./config
COPY fixtures ./fixtures
COPY src ./src

ENV HOST=0.0.0.0
ENV PORT=10000
EXPOSE 10000

CMD ["bun", "run", "start"]
