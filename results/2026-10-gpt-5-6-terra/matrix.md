# GPT-5.6 Terra via Codex CLI, T1-T5

Provider-reported usage from Codex `turn.completed`. Totals include the Codex CLI harness: its system instructions, tool descriptions and session history are resent on every model request, mostly as cached input (80% for WebMCP, 89% for Playwright MCP and DOM). Every cell passes both oracles; every task satisfies `webmcp < playwright-mcp < dom`. Per-cell `summary.json` in `T*-*/`.

| Test | Interface | Total | Input | Cached input | Output | Reasoning | Calls | Time |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| T1 | webmcp | 47107 | 46868 | 38912 | 239 | 59 | 1 | 14.4s |
| T1 | playwright-mcp | 105675 | 105160 | 92160 | 515 | 52 | 8 | 29.0s |
| T1 | dom | 118423 | 117967 | 89344 | 456 | 79 | 6 | 29.0s |
| T2 | webmcp | 86772 | 86370 | 61952 | 402 | 64 | 5 | 17.4s |
| T2 | playwright-mcp | 221193 | 220235 | 186112 | 958 | 292 | 11 | 47.9s |
| T2 | dom | 233564 | 232725 | 209408 | 839 | 181 | 12 | 73.6s |
| T3 | webmcp | 86277 | 85758 | 72960 | 519 | 98 | 5 | 21.7s |
| T3 | playwright-mcp | 195334 | 194483 | 178688 | 851 | 149 | 12 | 57.0s |
| T3 | dom | 267040 | 266084 | 242944 | 956 | 272 | 18 | 68.2s |
| T4 | webmcp | 46255 | 46022 | 32000 | 233 | 46 | 1 | 18.0s |
| T4 | playwright-mcp | 124574 | 124075 | 108288 | 499 | 107 | 7 | 29.8s |
| T4 | dom | 166336 | 165680 | 134912 | 656 | 260 | 6 | 34.3s |
| T5 | webmcp | 99106 | 98433 | 86016 | 673 | 139 | 9 | 18.4s |
| T5 | playwright-mcp | 386640 | 384865 | 355840 | 1775 | 326 | 24 | 110.8s |
| T5 | dom | 398402 | 396499 | 372224 | 1903 | 604 | 30 | 144.6s |
| T1-T5 | webmcp | 365517 | 363451 | 291840 | 2066 | 406 | 21 | 89.9s |
| T1-T5 | playwright-mcp | 1033416 | 1028818 | 921088 | 4598 | 926 | 62 | 274.5s |
| T1-T5 | dom | 1183765 | 1178955 | 1048832 | 4810 | 1396 | 72 | 349.7s |
