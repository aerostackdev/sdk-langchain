import { describe, it, expect, vi } from 'vitest';
import { convertTools, formatToolResult } from '../converter.js';
import { WorkspaceClient, AerostackError } from '@aerostack/core';
import type { McpTool } from '@aerostack/core';

function mockClient(callToolResult: unknown, shouldThrow = false): WorkspaceClient {
    return {
        callTool: shouldThrow
            ? vi.fn().mockRejectedValue(callToolResult)
            : vi.fn().mockResolvedValue(callToolResult),
    } as unknown as WorkspaceClient;
}

describe('convertTools', () => {
    it('converts MCP tools to LangChain DynamicStructuredTool array', () => {
        const mcpTools: McpTool[] = [
            {
                name: 'github__create_issue',
                description: 'Create a GitHub issue',
                inputSchema: {
                    type: 'object',
                    properties: { title: { type: 'string' } },
                    required: ['title'],
                },
            },
            {
                name: 'slack__post_message',
                description: 'Post to Slack',
            },
        ];

        const client = mockClient({});
        const tools = convertTools(mcpTools, client);

        expect(tools).toHaveLength(2);
        expect(tools[0]!.name).toBe('github__create_issue');
        expect(tools[0]!.description).toBe('Create a GitHub issue');
        expect(tools[1]!.name).toBe('slack__post_message');
    });

    it('handles tools with no description', () => {
        const mcpTools: McpTool[] = [
            { name: 'my_tool', inputSchema: { type: 'object', properties: {} } },
        ];

        const client = mockClient({});
        const tools = convertTools(mcpTools, client);

        expect(tools[0]!.name).toBe('my_tool');
        expect(tools[0]!.description).toBe('my_tool tool');
    });

    it('skips tools with empty names', () => {
        const mcpTools: McpTool[] = [
            { name: '', description: 'Bad' },
            { name: 'good', description: 'Good' },
        ];

        const client = mockClient({});
        const tools = convertTools(mcpTools, client);

        expect(tools).toHaveLength(1);
        expect(tools[0]!.name).toBe('good');
    });

    it('handles empty tools array', () => {
        const client = mockClient({});
        expect(convertTools([], client)).toEqual([]);
    });

    it('tool invoke calls WorkspaceClient.callTool', async () => {
        const mcpTools: McpTool[] = [
            {
                name: 'test_tool',
                description: 'Test',
                inputSchema: { type: 'object', properties: { x: { type: 'number' } } },
            },
        ];

        const client = mockClient({
            content: [{ type: 'text', text: 'result123' }],
        });
        const tools = convertTools(mcpTools, client);

        const result = await tools[0]!.invoke({ x: 42 });

        expect(client.callTool).toHaveBeenCalledWith('test_tool', { x: 42 });
        expect(result).toBe('result123');
    });

    it('tool handles AerostackError gracefully', async () => {
        const err = new AerostackError('Server down', 503, -32603, 'req-1');
        const client = mockClient(err, true);

        const mcpTools: McpTool[] = [
            { name: 'failing_tool', description: 'Fails' },
        ];

        const tools = convertTools(mcpTools, client);
        const result = await tools[0]!.invoke({});

        expect(result).toContain('Error (-32603)');
        expect(result).toContain('Server down');
    });

    it('tool handles generic errors', async () => {
        const client = mockClient(new Error('Network timeout'), true);

        const mcpTools: McpTool[] = [
            { name: 'timeout_tool', description: 'Timeouts' },
        ];

        const tools = convertTools(mcpTools, client);
        const result = await tools[0]!.invoke({});

        expect(result).toBe('Error: Network timeout');
    });
});

describe('formatToolResult', () => {
    it('formats single text content', () => {
        expect(formatToolResult({
            content: [{ type: 'text', text: 'Hello' }],
        })).toBe('Hello');
    });

    it('concatenates multiple text blocks', () => {
        expect(formatToolResult({
            content: [
                { type: 'text', text: 'Line 1' },
                { type: 'text', text: 'Line 2' },
            ],
        })).toBe('Line 1\nLine 2');
    });

    it('prefixes error results', () => {
        expect(formatToolResult({
            content: [{ type: 'text', text: 'Failed' }],
            isError: true,
        })).toBe('Error: Failed');
    });

    it('handles empty content', () => {
        expect(formatToolResult({ content: [] })).toBe('Success (no output)');
        expect(formatToolResult({})).toBe('Success (no output)');
    });

    it('handles empty content with isError', () => {
        expect(formatToolResult({ content: [], isError: true })).toBe('Error: Tool returned no content');
    });
});
