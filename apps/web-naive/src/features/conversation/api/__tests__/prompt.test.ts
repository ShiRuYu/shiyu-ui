import { beforeEach, describe, expect, it, vi } from 'vitest';

const requestMock = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));
vi.mock('#/shared/api/request', () => ({ requestClient: requestMock }));

import {
  createPrompt,
  listPrompts,
  previewPrompt,
  publishPrompt,
} from '../prompt';

describe('conversation prompt facade', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps prompt lifecycle operations to the conversation domain', async () => {
    requestMock.get.mockResolvedValue([]);
    requestMock.post.mockResolvedValue({});

    await listPrompts();
    await createPrompt({
      name: 'Tutor',
      template: '{{question}}',
      variables: ['question'],
    });
    await previewPrompt({
      template: '{{question}}',
      variables: { question: 'Why?' },
    });
    await publishPrompt('prompt-1');

    expect(requestMock.get).toHaveBeenCalledWith('/api/conversation/prompts');
    expect(requestMock.post).toHaveBeenNthCalledWith(
      1,
      '/api/conversation/prompts',
      {
        name: 'Tutor',
        template: '{{question}}',
        variables: ['question'],
      },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      2,
      '/api/conversation/prompts/preview',
      {
        template: '{{question}}',
        variables: { question: 'Why?' },
      },
    );
    expect(requestMock.post).toHaveBeenNthCalledWith(
      3,
      '/api/conversation/prompts/prompt-1/publish',
    );
  });
});
