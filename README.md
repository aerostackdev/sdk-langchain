# @aerostack/sdk-langchain

Use [Aerostack](https://aerostack.dev) workspace tools as [LangChain.js](https://js.langchain.com/) tools.

**Aerostack** is the full-stack platform for AI agents — compose MCP servers, skills, and functions into a single workspace URL that any AI agent can call. This SDK lets you drop 250+ pre-built tools into your LangChain agent in 3 lines of code.

[![npm version](https://img.shields.io/npm/v/@aerostack/sdk-langchain.svg)](https://www.npmjs.com/package/@aerostack/sdk-langchain)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## Why?

Building LangChain agents means writing custom tool wrappers for every external service. With Aerostack, you compose a workspace of tools (GitHub, Slack, Notion, Stripe, 250+ more) and this SDK converts them into `DynamicStructuredTool` instances that work with any LangChain agent or model.

```
Your Agent → LangChain → @aerostack/sdk-langchain → Aerostack Workspace → GitHub, Slack, Notion, ...
```

## Install

```bash
npm install @aerostack/sdk-langchain @langchain/core
```

## Quick Start — ReAct Agent

```typescript
import { ChatOpenAI } from '@langchain/openai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { getTools } from '@aerostack/sdk-langchain';

const { tools } = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });

const agent = createReactAgent({
    llm: new ChatOpenAI({ model: 'gpt-4o' }),
    tools,
});

const result = await agent.invoke({
    messages: [{ role: 'user', content: 'Create a GitHub issue for the login bug' }],
});
```

## Direct Tool Binding

Bind tools directly to any LangChain chat model:

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { getTools } from '@aerostack/sdk-langchain';

const { tools } = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });
const model = new ChatAnthropic({ model: 'claude-sonnet-4-20250514' }).bindTools(tools);

const response = await model.invoke('Check open PRs on GitHub');
```

## Works With Any LLM

```typescript
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatGroq } from '@langchain/groq';

// Gemini
const agent = createReactAgent({
    llm: new ChatGoogleGenerativeAI({ model: 'gemini-2.0-flash' }),
    tools,
});

// Groq
const agent = createReactAgent({
    llm: new ChatGroq({ model: 'llama-3.3-70b-versatile' }),
    tools,
});
```

## LangGraph Workflows

Use the tools inside LangGraph state machines for complex multi-step workflows:

```typescript
import { StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';

const { tools } = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });
const toolNode = new ToolNode(tools);

// Use toolNode in your LangGraph workflow
```

## Factory Pattern

For reusable clients that share a single connection:

```typescript
import { createAerostackLangChain } from '@aerostack/sdk-langchain';

const aero = createAerostackLangChain({ workspace: 'my-workspace', token: 'mwt_...' });
const { tools } = await aero.tools();
```

## API Reference

### `getTools(config)` → `Promise<ToolSetResult>`

Fetches tools from the workspace and converts to LangChain `DynamicStructuredTool[]`. Each tool auto-executes via the workspace gateway. Returns `{ tools, raw }`.

### `createAerostackLangChain(config)` → `AerostackLangChainClient`

Creates a reusable client that shares a single WorkspaceClient instance.

### `formatToolResult(result)`

Lower-level utility to flatten MCP tool results into strings.

## How It Works

1. **Tool Discovery** — `getTools()` calls your Aerostack workspace gateway to fetch all connected MCP server tools
2. **Format Conversion** — MCP tool schemas (JSON Schema) are wrapped as `DynamicStructuredTool` instances with name, description, and schema
3. **Auto-Execution** — Each tool's `func` proxies calls through the workspace gateway to actual MCP servers
4. **Error Handling** — Errors are caught and returned as string results, keeping the agent conversation flow intact

## Requirements

- **Node.js** 18+
- **@langchain/core** >= 0.2.0
- An [Aerostack](https://aerostack.dev) workspace with a token (`mwt_...`)

## Getting Your Workspace Token

1. Sign up at [app.aerostack.dev](https://app.aerostack.dev)
2. Create a workspace and add MCP servers (GitHub, Slack, Notion, etc.)
3. Copy the workspace token (`mwt_...`) from the workspace settings

## Related Packages

| Package | Framework |
|---------|-----------|
| [`@aerostack/sdk-openai`](https://github.com/aerostackdev/sdk-openai) | OpenAI SDK |
| [`@aerostack/sdk-vercel-ai`](https://github.com/aerostackdev/sdk-vercel-ai) | Vercel AI SDK |
| [`@aerostack/core`](https://github.com/aerostackdev/sdk-shared-core) | Core types + WorkspaceClient |

## Links

- [Aerostack Website](https://aerostack.dev)
- [Documentation](https://docs.aerostack.dev)
- [Dashboard](https://app.aerostack.dev)
- [MCP Marketplace](https://aerostack.dev/explore)
- [GitHub](https://github.com/aerostackdev)

## License

MIT
