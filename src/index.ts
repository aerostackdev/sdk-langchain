/**
 * @aerostack/sdk-langchain — Use Aerostack workspace tools as LangChain.js tools.
 *
 * @example
 * ```ts
 * import { ChatOpenAI } from '@langchain/openai';
 * import { createReactAgent } from '@langchain/langgraph/prebuilt';
 * import { getTools } from '@aerostack/sdk-langchain';
 *
 * const tools = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });
 *
 * const agent = createReactAgent({
 *     llm: new ChatOpenAI({ model: 'gpt-4o' }),
 *     tools,
 * });
 *
 * const result = await agent.invoke({
 *     messages: [{ role: 'user', content: 'Create a GitHub issue for the login bug' }],
 * });
 * ```
 *
 * @example Direct tool binding
 * ```ts
 * import { ChatAnthropic } from '@langchain/anthropic';
 * import { getTools } from '@aerostack/sdk-langchain';
 *
 * const tools = await getTools({ workspace: 'my-workspace', token: 'mwt_...' });
 * const model = new ChatAnthropic({ model: 'claude-sonnet-4-20250514' }).bindTools(tools);
 * ```
 */

import type { DynamicStructuredTool } from '@langchain/core/tools';
import { WorkspaceClient } from '@aerostack/core';
import type { McpTool } from '@aerostack/core';
import { convertTools } from './converter.js';

export { formatToolResult } from './converter.js';

export interface WorkspaceConfig {
    /** Workspace slug */
    workspace: string;
    /** Workspace token (mwt_...) */
    token: string;
    /** Override gateway base URL */
    baseUrl?: string;
}

/** Result from getTools. */
export interface ToolSetResult {
    /** LangChain tools — pass to createReactAgent({ tools }) or model.bindTools(tools) */
    tools: DynamicStructuredTool[];
    /** Raw MCP tools from the workspace for inspection */
    raw: McpTool[];
}

function createWorkspaceClient(config: WorkspaceConfig): WorkspaceClient {
    return new WorkspaceClient({
        slug: config.workspace,
        token: config.token,
        baseUrl: config.baseUrl,
    });
}

// ---------------------------------------------------------------------------
// Standalone function
// ---------------------------------------------------------------------------

/**
 * Fetch tools from an Aerostack workspace and convert to LangChain format.
 *
 * Each tool includes a function that calls the workspace gateway,
 * so you just pass the tools to an agent or bind them to a model.
 */
export async function getTools(config: WorkspaceConfig): Promise<ToolSetResult> {
    const client = createWorkspaceClient(config);
    const raw = await client.listTools();
    const tools = convertTools(raw, client);
    return { tools, raw };
}

// ---------------------------------------------------------------------------
// Factory pattern
// ---------------------------------------------------------------------------

export interface AerostackLangChainClient {
    /** Fetch and convert workspace tools to LangChain format. */
    tools(): Promise<ToolSetResult>;
    /** Access the underlying WorkspaceClient for advanced use. */
    readonly workspaceClient: WorkspaceClient;
}

/**
 * Create a reusable Aerostack LangChain client.
 *
 * Reuses a single WorkspaceClient instance across tool calls.
 */
export function createAerostackLangChain(config: WorkspaceConfig): AerostackLangChainClient {
    const wsClient = createWorkspaceClient(config);

    return {
        async tools(): Promise<ToolSetResult> {
            const raw = await wsClient.listTools();
            const tools = convertTools(raw, wsClient);
            return { tools, raw };
        },

        get workspaceClient(): WorkspaceClient {
            return wsClient;
        },
    };
}
