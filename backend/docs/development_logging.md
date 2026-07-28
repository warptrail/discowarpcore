# Backend development logs

Disco Warp Core writes development events to standard output and standard
error so Tarot can collect them through `logs backend` and `scry-all`.

Structured records use one JSON object per line:

```text
[backend] {"timestamp":"...","level":"info","event":"http.request.completed","requestId":"...","method":"GET","path":"/api/declutter-deck","queryKeys":["player"],"status":200,"outcome":"completed","durationMs":12.4}
```

## Useful fields

- `event` identifies the lifecycle or domain operation.
- `requestId` connects an API response to its backend records. Every API
  response also includes an `X-Request-Id` header; error JSON includes
  `requestId`.
- `durationMs` records elapsed backend time.
- `status` and `outcome` describe the HTTP result.
- Declutter events include safe identifiers, player, visible vote,
  `normalizedDecision`, `exitPreference`, resulting `deckState`, `resolution`,
  and `stagingRoute`.
- Fatal startup and uncaught process errors include a bounded error stack.

Request bodies, note text, query values, cookies, authorization headers, and
other personal payloads are deliberately excluded. HTTP request records contain
query key names only.

## Reports to share

When something is broken, capture these from Tarot without starting another
server:

```text
status
health
logs backend
logs frontend
```

If the browser shows a `requestId`, include it with the report. An agent can
search the backend log for that exact value and follow both the domain event and
the final HTTP record.
