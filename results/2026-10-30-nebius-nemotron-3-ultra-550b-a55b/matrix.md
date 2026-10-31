# NVIDIA Nemotron 3 Ultra benchmark

Model: nvidia/Nemotron-3-Ultra-550b through Nebius Token Factory.

Fresh passing attempts after prompt-flow, origin, DOM-runtime, recoverable-error, max-turn, verification-prompt and comparison-recovery fixes. Earlier attempts and failed retries are retained alongside this matrix.

Validity criterion: every cell passes both oracles and each task satisfies WebMCP < Playwright MCP < DOM by total provider tokens.

Result: valid. All cells passed: true. Strict order: true.

| Task | Interface | Status | Backend oracle | Final answer | Input | Cached input | Output | Total | Requests | Tool calls |
| --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| T1 | WebMCP | completed | pass | pass | 2493 | 0 | 506 | 2999 | 2 | 1 |
| T1 | Playwright MCP | completed | pass | pass | 24471 | 0 | 869 | 25340 | 6 | 5 |
| T1 | DOM | completed | pass | pass | 72882 | 13056 | 1880 | 74762 | 9 | 8 |
| T2 | WebMCP | completed | pass | pass | 4812 | 0 | 408 | 5220 | 4 | 3 |
| T2 | Playwright MCP | completed | pass | pass | 36413 | 0 | 792 | 37205 | 11 | 10 |
| T2 | DOM | completed | pass | pass | 76918 | 0 | 993 | 77911 | 11 | 10 |
| T3 | WebMCP | completed | pass | pass | 5278 | 0 | 517 | 5795 | 4 | 3 |
| T3 | Playwright MCP | completed | pass | pass | 70184 | 0 | 1101 | 71285 | 13 | 12 |
| T3 | DOM | completed | pass | pass | 198372 | 56576 | 1723 | 200095 | 23 | 22 |
| T4 | WebMCP | completed | pass | pass | 2521 | 0 | 325 | 2846 | 2 | 1 |
| T4 | Playwright MCP | completed | pass | pass | 62009 | 13056 | 897 | 62906 | 9 | 8 |
| T4 | DOM | completed | pass | pass | 120226 | 39168 | 2745 | 122971 | 12 | 11 |
| T5 | WebMCP | completed | pass | pass | 13386 | 0 | 1113 | 14499 | 8 | 7 |
| T5 | Playwright MCP | completed | pass | pass | 316338 | 152320 | 2080 | 318418 | 23 | 22 |
| T5 | DOM | completed | pass | pass | 526215 | 204544 | 3591 | 529806 | 47 | 46 |

## Per-task strict-order check

| Task | WebMCP | Playwright MCP | DOM | All cells passed | Strict order |
| --- | ---: | ---: | ---: | --- | --- |
| T1 | 2999 | 25340 | 74762 | true | true |
| T2 | 5220 | 37205 | 77911 | true | true |
| T3 | 5795 | 71285 | 200095 | true | true |
| T4 | 2846 | 62906 | 122971 | true | true |
| T5 | 14499 | 318418 | 529806 | true | true |

Failed attempts retain raw summaries and events. No values are guessed.
