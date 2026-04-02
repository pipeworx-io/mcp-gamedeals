# mcp-gamedeals

MCP server for video game deals via the [CheapShark API](https://www.cheapshark.com/). No authentication required.

## Tools

| Tool | Description |
|------|-------------|
| `search_deals` | Search game deals with filters and sorting |
| `search_games` | Search games by title and get cheapest prices |
| `get_game_details` | Get price history and all store deals for a game |
| `list_stores` | List all supported game stores |

## Quickstart (Pipeworx Gateway)

```bash
curl -X POST https://gateway.pipeworx.io/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"gamedeals_search_deals","arguments":{"title":"Elden Ring"}},"id":1}'
```

## License

MIT
