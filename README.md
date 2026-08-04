# mcp-gamedeals

Gamedeals MCP — wraps CheapShark API (game deal aggregator, no auth required)

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_deals` | Search active game deals with optional filters by store, platform, or discount level. Returns deal title, store, sale price, normal price, savings %, Metacritic score, and deal rating. |
| `search_games` | Find games by title to compare current prices across stores. Returns cheapest price, deal ID, and availability info for price tracking. |
| `get_game_details` | Get complete pricing history for a game: current deals across all stores, historical low prices, and price trends over time. |
| `list_stores` | View all tracked game retailers (e.g., Steam, Epic Games, GOG). Returns store names and IDs for filtering deals by specific stores. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "gamedeals": {
      "url": "https://gateway.pipeworx.io/gamedeals/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Gamedeals data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
