# Inventory MCP: on-demand stdio over SSH

Disco Warp Core now contains a read-only MCP server for Codex. It is an
ordinary JavaScript process, not a second database and not a network daemon.

```text
Codex on Mac
  → SSH stdin/stdout
  → mcp/inventoryServer.mjs on Linux
  → http://127.0.0.1:<production-api-port>/api
  → Express → MongoDB and media services
```

The MCP server currently exposes these read-only tools:

- `inventory_health`
- `search_inventory`
- `get_inventory_item`
- `get_inventory_box`
- `list_inventory_locations`

It deliberately has no write tools yet. All future mutations should continue
through the existing Express API, with a proposal/diff and explicit approval
before applying changes.

## Local smoke test

With a local backend running on the default port:

```bash
DISCO_API_BASE=http://127.0.0.1:7610/api npm run mcp:inventory
```

The process waits for MCP protocol messages on stdin. Seeing no human-readable
output is normal. Do not add ordinary logs to stdout; stdout belongs to MCP.

## Linux production launch over SSH

The remote command must run without a pseudo-terminal and must not print shell
startup text to stdout. Replace the API port or paths if the production
deployment differs:

```bash
ssh -T neonazoth \
  "env DISCO_API_BASE=http://127.0.0.1:5002/api \
  /usr/bin/node /home/warptrail/discowarpcore/mcp/inventoryServer.mjs"
```

The repository also includes a stable launcher. For a human smoke test:

```bash
npm run mcp:inventory:ssh
```

It defaults to the existing `neonazoth` SSH alias, the production checkout at
`/home/warptrail/discowarpcore`, and the production API at port `5002`. These
values can be overridden without editing the launcher:

```bash
DISCO_SSH_HOST=neonazoth \
DISCO_REMOTE_REPO=/home/warptrail/discowarpcore \
DISCO_REMOTE_API_BASE=http://127.0.0.1:5002/api \
npm run mcp:inventory:ssh
```

Codex should invoke the launcher script directly, rather than through `npm
run`, because npm may print a banner to stdout and stdout belongs exclusively
to the MCP protocol:

```json
{
  "command": "/Volumes/Luna/Developer-Luna/discowarpcore/scripts/inventory-mcp-ssh.sh",
  "args": []
}
```

The SSH process becomes the pipe between Codex and the Node MCP server. When
Codex disconnects, the MCP process exits; no `systemd` service or open MCP port
is required.

Conceptual client configuration:

```json
{
  "command": "/Volumes/Luna/Developer-Luna/discowarpcore/scripts/inventory-mcp-ssh.sh",
  "args": []
}
```

The exact configuration location depends on the MCP client. The command is
the important part.

## Deployment notes

The MCP source lives in the same checkout as the backend so the existing
protected deployment workflow can carry it to the production host. The Linux
host needs the root `npm install` to include `@modelcontextprotocol/sdk` and
`zod` before the command is launched there.

The MCP server must never connect directly to MongoDB for this workflow. It
should call the local production API, preserving backend validation, logging,
box-nesting rules, and media ownership.
