/**
 * Gamedeals MCP — wraps CheapShark API (game deal aggregator, no auth required)
 *
 * Tools:
 * - search_deals: Search game deals with filters and sorting
 * - search_games: Search games by title and get cheapest prices
 * - get_game_details: Get price history and all store deals for a game
 * - list_stores: List all supported game stores
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const BASE_URL = 'https://www.cheapshark.com/api/1.0';

// --- Raw API types ---

type RawDeal = {
  gameID: string;
  title: string;
  dealID: string;
  storeID: string;
  salePrice: string;
  normalPrice: string;
  savings: string;
  metacriticScore: string;
  steamRatingPercent: string;
  steamRatingCount: string;
  dealRating: string;
  thumb: string;
};

type RawGame = {
  gameID: string;
  external: string;
  cheapest: string;
  cheapestDealID: string;
  thumb: string;
};

type RawGameDeal = {
  storeID: string;
  dealID: string;
  price: string;
  retailPrice: string;
  savings: string;
};

type RawGameInfo = {
  name: string;
  steamAppID: string | null;
  thumb: string;
};

type RawGameDetails = {
  info: RawGameInfo;
  cheapestPriceEver: { price: string; date: number };
  deals: RawGameDeal[];
};

type RawStore = {
  storeID: string;
  storeName: string;
  isActive: number;
  images: {
    banner: string;
    logo: string;
    icon: string;
  };
};

// --- Tool definitions ---

const tools: McpToolExport['tools'] = [
  {
    name: 'search_deals',
    description:
      'Search for game deals with optional filters. Returns deal title, store, sale price, normal price, savings percentage, Metacritic score, and deal rating.',
    inputSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Filter deals by game title (partial match supported)',
        },
        upper_price: {
          type: 'number',
          description: 'Maximum price filter (e.g., 5 for deals under $5)',
        },
        lower_price: {
          type: 'number',
          description: 'Minimum price filter',
        },
        store_id: {
          type: 'string',
          description: 'Filter by store ID (use list_stores to get IDs)',
        },
        sort_by: {
          type: 'string',
          description:
            'Sort order: "Deal Rating" (default), "Price", "Metacritic", or "Reviews"',
        },
        page_size: {
          type: 'number',
          description: 'Number of results to return (default: 10, max: 60)',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_games',
    description:
      'Search for games by title. Returns each game with its cheapest current price and a deal ID to get more details.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Game title to search for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_game_details',
    description:
      'Get full price details for a game including price history, cheapest price ever recorded, and current deals across all stores.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'CheapShark game ID (obtained from search_games)',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_stores',
    description:
      'List all game stores tracked by CheapShark. Returns store names and IDs for use with search_deals.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// --- callTool dispatcher ---

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_deals':
      return searchDeals(args as SearchDealsArgs);
    case 'search_games':
      return searchGames(args.query as string, (args.limit as number | undefined) ?? 10);
    case 'get_game_details':
      return getGameDetails(args.id as string);
    case 'list_stores':
      return listStores();
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// --- Arg types ---

type SearchDealsArgs = {
  title?: string;
  upper_price?: number;
  lower_price?: number;
  store_id?: string;
  sort_by?: string;
  page_size?: number;
};

// --- Tool implementations ---

async function searchDeals(args: SearchDealsArgs) {
  const params = new URLSearchParams();

  if (args.title) params.set('title', args.title);
  if (args.upper_price != null) params.set('upperPrice', String(args.upper_price));
  if (args.lower_price != null) params.set('lowerPrice', String(args.lower_price));
  if (args.store_id) params.set('storeID', args.store_id);
  if (args.sort_by) params.set('sortBy', args.sort_by);
  params.set('pageSize', String(args.page_size ?? 10));

  const res = await fetch(`${BASE_URL}/deals?${params.toString()}`);
  if (!res.ok) throw new Error(`CheapShark error: ${res.status}`);

  const data = (await res.json()) as RawDeal[];

  return {
    total: data.length,
    deals: data.map((d) => ({
      game_id: d.gameID,
      deal_id: d.dealID,
      title: d.title,
      store_id: d.storeID,
      sale_price: parseFloat(d.salePrice),
      normal_price: parseFloat(d.normalPrice),
      savings_percent: Math.round(parseFloat(d.savings)),
      metacritic_score: d.metacriticScore !== '0' ? parseInt(d.metacriticScore, 10) : null,
      steam_rating_percent:
        d.steamRatingPercent !== '0' ? parseInt(d.steamRatingPercent, 10) : null,
      deal_rating: parseFloat(d.dealRating),
      thumb: d.thumb,
    })),
  };
}

async function searchGames(query: string, limit: number) {
  const params = new URLSearchParams({ title: query, limit: String(limit) });
  const res = await fetch(`${BASE_URL}/games?${params.toString()}`);
  if (!res.ok) throw new Error(`CheapShark error: ${res.status}`);

  const data = (await res.json()) as RawGame[];

  return {
    total: data.length,
    games: data.map((g) => ({
      game_id: g.gameID,
      title: g.external,
      cheapest_price: parseFloat(g.cheapest),
      cheapest_deal_id: g.cheapestDealID,
      thumb: g.thumb,
    })),
  };
}

async function getGameDetails(id: string) {
  const res = await fetch(`${BASE_URL}/games?id=${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`CheapShark error: ${res.status}`);

  const data = (await res.json()) as RawGameDetails;

  return {
    game_id: id,
    name: data.info.name,
    steam_app_id: data.info.steamAppID ?? null,
    thumb: data.info.thumb,
    cheapest_price_ever: {
      price: parseFloat(data.cheapestPriceEver.price),
      date: new Date(data.cheapestPriceEver.date * 1000).toISOString().split('T')[0],
    },
    deals: data.deals.map((d) => ({
      store_id: d.storeID,
      deal_id: d.dealID,
      price: parseFloat(d.price),
      retail_price: parseFloat(d.retailPrice),
      savings_percent: Math.round(parseFloat(d.savings)),
    })),
  };
}

async function listStores() {
  const res = await fetch(`${BASE_URL}/stores`);
  if (!res.ok) throw new Error(`CheapShark error: ${res.status}`);

  const data = (await res.json()) as RawStore[];

  return {
    total: data.length,
    stores: data
      .filter((s) => s.isActive === 1)
      .map((s) => ({
        store_id: s.storeID,
        name: s.storeName,
        icon: `https://www.cheapshark.com${s.images.icon}`,
      })),
  };
}

export default { tools, callTool } satisfies McpToolExport;
