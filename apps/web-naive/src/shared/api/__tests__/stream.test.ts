import { describe, expect, it, vi } from 'vitest';

import { consumeEventStream, parseEventFrame } from '../stream';

describe('server-sent event parser', () => {
  it('joins multiline data and ignores comments', () => {
    expect(
      parseEventFrame(': ping\nid: 7\nevent: token\ndata: hello\ndata: world'),
    ).toEqual({
      data: 'hello\nworld',
      event: 'token',
      id: '7',
    });
  });

  it('handles event frames split across network chunks', async () => {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"content":"hel'));
        controller.enqueue(encoder.encode('lo"}\n\ndata: [DONE]\n\n'));
        controller.close();
      },
    });
    const onEvent = vi.fn();

    await consumeEventStream(new Response(stream), onEvent);

    expect(onEvent).toHaveBeenNthCalledWith(1, {
      data: '{"content":"hello"}',
    });
    expect(onEvent).toHaveBeenNthCalledWith(2, { data: '[DONE]' });
  });

  it('rejects with AbortError when a pending stream is cancelled', async () => {
    const controller = new AbortController();
    const stream = new ReadableStream({ start() {} });
    const consuming = consumeEventStream(
      new Response(stream),
      vi.fn(),
      controller.signal,
    );

    controller.abort();

    await expect(consuming).rejects.toMatchObject({ name: 'AbortError' });
  });
});
