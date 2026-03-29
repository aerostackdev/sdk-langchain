# @aerostack/sdk-langchain

Use [Aerostack](https://aerostack.dev) workspace tools as [LangChain.js](https://js.langchain.com/) tools.

## Install

```bash
npm install @aerostack/sdk-langchain @langchain/core
```

## Quick Start

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

```typescript
import { ChatAnthropic } from '@langchain/anthropic';
import { getTools } from '@aerostack/sdk-langchain';

const { tools } = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });
const model = new ChatAnthropic({ model: 'claude-sonnet-4-20250514' }).bindTools(tools);
```

## Factory Pattern

```typescript
import { createAerostackLangChain } from '@aerostack/sdk-langchain';

const aero = createAerostackLangChain({ workspace: 'my-workspace', token: 'mwt_...' });
const { tools } = await aero.tools();
```

## API

### `getTools(config)` → `Promise<ToolSetResult>`

Fetches tools from the workspace. Each tool auto-executes via the workspace gateway. Returns `{ tools, raw }`.

### `createAerostackLangChain(config)` → `AerostackLangChainClient`

Creates a reusable client that shares a single WorkspaceClient instance.

## Requirements

- `@langchain/core` >= 0.2.0
- An Aerostack workspace with a token (`mwt_...`)
