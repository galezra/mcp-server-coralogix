# Coralogix MCP Server

> **DISCLAIMER**: This is a community-maintained project and is not officially affiliated with, endorsed by, or supported by Coralogix, Inc. This MCP server utilizes the Coralogix API but is developed independently as part of the [Model Context Protocol](https://github.com/modelcontextprotocol/servers) ecosystem.

<!-- Add badges once available -->

MCP server for the Coralogix API, enabling observability, monitoring, and more.

## Features

- **Observability Tools**: Provides a mechanism to leverage key Coralogix features, such as logs, metrics, traces, and alerts, through the MCP server.
- **Extensible Design**: Designed to easily integrate with additional Coralogix APIs, allowing for seamless future feature expansion.

## Tools

1. `list_alerts`

   - Retrieve a list of alerts from Coralogix.
   - **Inputs**:
     - `status` (optional string): Filter alerts by status (e.g., "active", "resolved").
     - `severity` (optional string): Filter alerts by severity (e.g., "critical", "warning", "info").
     - `limit` (optional number): Maximum number of alerts to return (defaults to 20).
     - `offset` (optional number): Offset for pagination (defaults to 0).
   - **Returns**: Array of Coralogix alerts.

2. `get_alert`

   - Retrieve detailed information about a specific Coralogix alert.
   - **Inputs**:
     - `alert_id` (string): Alert ID to fetch details for.
   - **Returns**: Detailed alert information.

3. `get_logs`

   - Search and retrieve logs from Coralogix.
   - **Inputs**:
     - `query` (string): Coralogix logs query string.
     - `from` (number): Start time in epoch seconds.
     - `to` (number): End time in epoch seconds.
     - `limit` (optional number): Maximum number of logs to return (defaults to 100).
   - **Returns**: Array of matching logs.

4. `get_all_services`

   - Extract all unique service names from logs in Coralogix.
   - **Inputs**:
     - `query` (optional string): Coralogix logs query string (defaults to "*").
     - `from` (number): Start time in epoch seconds.
     - `to` (number): End time in epoch seconds.
     - `limit` (optional number): Maximum number of logs to search through (defaults to 1000).
   - **Returns**: Array of unique service names.

5. `query_metrics`

   - Retrieve metrics data from Coralogix.
   - **Inputs**:
     - `query` (string): Coralogix metrics query string.
     - `from` (number): Start time in epoch seconds.
     - `to` (number): End time in epoch seconds.
   - **Returns**: Metrics data for the queried timeframe.

6. `search_traces`

   - Search and retrieve traces from Coralogix.
   - **Inputs**:
     - `query` (string): Coralogix trace query string.
     - `from` (number): Start time in epoch seconds.
     - `to` (number): End time in epoch seconds.
     - `limit` (optional number): Maximum number of traces to return (defaults to 100).
     - `service` (optional string): Filter by service name.
     - `operation` (optional string): Filter by operation name.
   - **Returns**: Array of matching traces.

## Setup

### Coralogix Credentials

You need valid Coralogix API credentials to use this MCP server:

- `CORALOGIX_API_KEY`: Your Coralogix API key
- `CORALOGIX_REGION` (optional): The Coralogix region (e.g., `EUROPE`, `US`, `INDIA`, `SINGAPORE`, `EUROPE2`)

Export them in your environment before running the server:

```bash
export CORALOGIX_API_KEY="your_api_key"
export CORALOGIX_REGION="your_region"  # Optional, defaults to EUROPE
```

## Installation

### Manual Installation

```bash
pnpm install
pnpm build
pnpm watch   # for development with auto-rebuild
```

## Usage with Claude Desktop

To use this with Claude Desktop, add the following to your `claude_desktop_config.json`:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`  
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcp": {
    "servers": {
      "coralogix": {
        "command": ["node", "/path/to/mcp-server-coralogix/build/index.js"],
        "environment": {
          "CORALOGIX_API_KEY": "your_api_key",
          "CORALOGIX_REGION": "your_region"  // Optional
        }
      }
    }
  }
}
```

### Usage with Docker

Build and run the Docker image:

```bash
docker build -t mcp-server-coralogix .
docker run -e CORALOGIX_API_KEY="your_api_key" -e CORALOGIX_REGION="your_region" mcp-server-coralogix
```

## Development

### Requirements

- Node.js >= 20
- pnpm >= 10

### Testing

```bash
pnpm test
```

### Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache License 2.0 - see the LICENSE file for details.
