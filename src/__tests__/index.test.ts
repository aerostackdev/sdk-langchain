import { describe, it, expect } from 'vitest';
import { getTools, createAerostackLangChain } from '../index.js';

describe('createAerostackLangChain', () => {
    it('returns an object with tools() and workspaceClient', () => {
        const client = createAerostackLangChain({
            workspace: 'test-ws',
            token: 'mwt_test',
        });

        expect(client.tools).toBeTypeOf('function');
        expect(client.workspaceClient).toBeDefined();
    });
});

describe('getTools', () => {
    it('is exported as a function', () => {
        expect(getTools).toBeTypeOf('function');
    });
});
