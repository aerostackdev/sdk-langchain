/**
 * Converts Aerostack McpTool definitions to LangChain.js tool format.
 */
import { DynamicStructuredTool } from '@langchain/core/tools';
import { WorkspaceClient, AerostackError } from '@aerostack/core';
import type { McpTool, McpToolResult } from '@aerostack/core';

/**
 * Convert McpTool array to LangChain DynamicStructuredTool array.
 *
 * Each tool gets a function that proxies through WorkspaceClient.callTool().
 * Pass the resulting array directly to `createReactAgent({ tools })` or
 * `model.bindTools(tools)`.
 *
 * @param mcpTools - Tools from WorkspaceClient.listTools()
 * @param client - WorkspaceClient instance for executing tool calls
 */
export function convertTools(
    mcpTools: McpTool[],
    client: WorkspaceClient,
): DynamicStructuredTool[] {
    const tools: DynamicStructuredTool[] = [];

    for (const mcpTool of mcpTools) {
        if (!mcpTool.name) continue;

        const schema = mcpTool.inputSchema
            ? (mcpTool.inputSchema as Record<string, unknown>)
            : { type: 'object' as const, properties: {} };

        tools.push(
            new DynamicStructuredTool({
                name: mcpTool.name,
                description: mcpTool.description ?? `${mcpTool.name} tool`,
                schema,
                func: async (args: Record<string, unknown>) => {
                    try {
                        const result = await client.callTool(mcpTool.name, args);
                        return formatToolResult(result);
                    } catch (err) {
                        if (err instanceof AerostackError) {
                            return `Error (${err.rpcCode}): ${err.message}`;
                        }
                        return err instanceof Error
                            ? `Error: ${err.message}`
                            : 'Error: Unknown error executing tool';
                    }
                },
            }),
        );
    }

    return tools;
}

/**
 * Flatten McpToolResult content array into a single string.
 */
export function formatToolResult(result: McpToolResult): string {
    if (!result.content || result.content.length === 0) {
        return result.isError ? 'Error: Tool returned no content' : 'Success (no output)';
    }

    const parts: string[] = [];
    for (const block of result.content) {
        if (block.text) {
            parts.push(block.text);
        } else if (block.data) {
            parts.push(`[${block.mimeType ?? 'binary'} data: ${block.data.length} chars base64]`);
        } else {
            parts.push(JSON.stringify(block));
        }
    }

    const text = parts.join('\n');
    return result.isError ? `Error: ${text}` : text;
}
