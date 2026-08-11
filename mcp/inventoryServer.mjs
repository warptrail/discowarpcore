import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  createInventoryApiClient,
  InventoryApiError,
} from './inventoryApiClient.mjs';

const api = createInventoryApiClient();
const server = new McpServer({
  name: 'disco-warp-core-inventory',
  version: '0.1.0',
});

function jsonText(value) {
  return JSON.stringify(value, null, 2);
}

function success(value) {
  return {
    content: [{ type: 'text', text: jsonText(value) }],
  };
}

function failure(error) {
  const message = error instanceof InventoryApiError
    ? error.message
    : `Inventory MCP tool failed: ${error?.message || String(error)}`;

  return {
    isError: true,
    content: [{ type: 'text', text: message }],
  };
}

async function run(readOperation) {
  try {
    return success(await readOperation());
  } catch (error) {
    return failure(error);
  }
}

server.registerTool(
  'inventory_health',
  {
    title: 'Check inventory API health',
    description: 'Check whether the configured Disco Warp Core API is reachable.',
    inputSchema: {},
  },
  () => run(() => api.getHealth())
);

server.registerTool(
  'search_inventory',
  {
    title: 'Search inventory',
    description:
      'Search active inventory items or boxes using names, tags, categories, locations, owners, and other existing retrieval filters. This tool is read-only.',
    inputSchema: {
      kind: z.enum(['items', 'boxes']).default('items'),
      query: z.string().optional().describe('Free-text item or box search.'),
      category: z.string().optional().describe('Item category or comma-separated categories.'),
      tag: z.string().optional().describe('Item tag or comma-separated tags.'),
      tag_operator: z.enum(['or', 'and']).optional(),
      location: z.string().optional(),
      owner: z.string().optional(),
      keep_priority: z.string().optional(),
      group: z.string().optional().describe('Box group filter.'),
      sort: z.string().optional(),
      limit: z.number().int().min(1).max(100).default(20),
      offset: z.number().int().min(0).max(100_000).default(0),
    },
  },
  (input) => run(() => {
    if (input.kind === 'boxes') {
      return api.searchBoxes({
        q: input.query,
        group: input.group,
        location: input.location,
        limit: input.limit,
        offset: input.offset,
      });
    }

    return api.searchItems({
      q: input.query,
      category: input.category,
      tag: input.tag,
      tagOperator: input.tag_operator,
      location: input.location,
      owner: input.owner,
      keepPriority: input.keep_priority,
      sort: input.sort,
      limit: input.limit,
      offset: input.offset,
    });
  })
);

server.registerTool(
  'get_inventory_item',
  {
    title: 'Get inventory item',
    description: 'Fetch one inventory item by its MongoDB id. This tool is read-only.',
    inputSchema: {
      item_id: z.string().min(1),
    },
  },
  ({ item_id }) => run(() => api.getItem(item_id))
);

server.registerTool(
  'get_inventory_box',
  {
    title: 'Get inventory box',
    description:
      'Fetch a box by its short box id, optionally including ancestors, statistics, and flattened contents. This tool is read-only.',
    inputSchema: {
      short_id: z.string().min(1),
      include_ancestors: z.boolean().default(true),
      include_stats: z.boolean().default(true),
      flat: z.enum(['none', 'items', 'all']).default('items'),
    },
  },
  ({ short_id, include_ancestors, include_stats, flat }) => run(() => api.getBox({
    shortId: short_id,
    includeAncestors: include_ancestors,
    includeStats: include_stats,
    flat,
  }))
);

server.registerTool(
  'list_inventory_locations',
  {
    title: 'List inventory locations',
    description: 'List the normalized locations known to the inventory. This tool is read-only.',
    inputSchema: {},
  },
  () => run(() => api.listLocations())
);

const transport = new StdioServerTransport();
await server.connect(transport);

