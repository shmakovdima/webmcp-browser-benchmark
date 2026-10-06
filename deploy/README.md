# Public deployment

The public service is only the synthetic store and its WebMCP surface. It does not run model calls and it must not receive a model-provider key.

## GitHub Pages

GitHub Pages cannot execute the Node server, so the public demo uses the static build:

```bash
bun install
bun run build:pages
```

The checked-in workflow builds `site/` and deploys it with GitHub Pages Actions. Enable GitHub Pages for the repository with `GitHub Actions` as the source. The generated app uses browser-local state, serves no model calls, and works under a repository subpath.

After deployment, open the HTTPS Pages URL and verify catalog filtering, cart updates, the synthetic checkout, and WebMCP registration in a WebMCP-capable Chrome build.

## Render

1. Push the contents of `webmcp-browser-benchmark/` to a public repository.
2. Create a Render Web Service from that repository.
3. Keep the root directory at the repository root if this folder is extracted into its own repository.
4. Use the checked-in `render.yaml` blueprint or select `Dockerfile` manually.
5. Set no secret environment variables.
6. Wait for the `/health` check to pass.
7. Open the HTTPS service URL and verify the catalog, cart, and synthetic checkout.

The service binds to `0.0.0.0` and uses the platform-provided `PORT`. HTTPS is required by browser implementations that expose WebMCP. The public service keeps state in memory and resets on restart.

## Public safety checks

```bash
bun -e "const base = process.env.PUBLIC_DEMO_URL; const health = await fetch(base + '/health'); console.log(health.status, await health.text()); const state = await fetch(base + '/api/state'); console.log(state.status);"
```

The health request must return 200. The state request must return 400 because it has no private run token. The public bundle must contain no `MODEL_ID`, provider URL, API key, or benchmark runner endpoint.

## Local container check

```bash
docker build -t webmcp-browser-benchmark .
docker run --rm -p 10000:10000 webmcp-browser-benchmark
```

Open `http://127.0.0.1:10000/` and confirm that the synthetic store loads.
