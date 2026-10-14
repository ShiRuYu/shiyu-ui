import { shallowMount } from '@vue/test-utils';

import { describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  data: { agentId: 'agent-1', name: 'Agent' },
  executeAgent: vi.fn(),
  executeAgentStream: vi.fn(),
  onOpenChange: undefined as ((open: boolean) => Promise<void>) | undefined,
}));

vi.mock('@vben/common-ui', () => ({
  useVbenModal: (options: {
    onOpenChange: (open: boolean) => Promise<void>;
  }) => {
    mock.onOpenChange = options.onOpenChange;
    return [{ template: '<div><slot /></div>' }, { getData: () => mock.data }];
  },
}));
vi.mock('#/features/agent/api', () => ({
  executeAgent: mock.executeAgent,
  executeAgentStream: mock.executeAgentStream,
}));
vi.mock('#/locales', () => ({ $t: (key: string) => key }));

import ChatModal from '../chat-modal.vue';

interface ChatView {
  loading: boolean;
  onSend: () => Promise<void>;
  prompt: string;
  response: string;
  stopGeneration: () => void;
  streamMode: boolean;
}

function deferred() {
  let resolve!: () => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, reject, resolve };
}

describe('agent chat modal request lifetime', () => {
  it('ignores an old request after closing and starting a new one', async () => {
    const first = deferred();
    const second = deferred();
    const callbacks: Array<(text: string) => void> = [];
    const signals: AbortSignal[] = [];
    mock.executeAgentStream.mockImplementation(
      (
        _agentId: string,
        _input: unknown,
        onText: (text: string) => void,
        options: { signal: AbortSignal },
      ) => {
        callbacks.push(onText);
        signals.push(options.signal);
        return callbacks.length === 1 ? first.promise : second.promise;
      },
    );

    const wrapper = shallowMount(ChatModal);
    const view = wrapper.vm as unknown as ChatView;
    await mock.onOpenChange?.(true);
    view.streamMode = true;
    view.prompt = 'first';
    const oldRequest = view.onSend();

    await mock.onOpenChange?.(false);
    expect(signals[0]?.aborted).toBe(true);
    await mock.onOpenChange?.(true);
    view.prompt = 'second';
    const newRequest = view.onSend();

    callbacks[0]?.('old reply');
    first.reject(new DOMException('Aborted', 'AbortError'));
    await oldRequest;
    expect(view.response).toBe('');
    expect(view.loading).toBe(true);

    callbacks[1]?.('new reply');
    second.resolve();
    await newRequest;
    expect(view.response).toBe('new reply');
    expect(signals[1]?.aborted).toBe(false);
    wrapper.unmount();
  });

  it('does not show an old synchronous result in a new chat', async () => {
    let finishOld!: (result: { output: string }) => void;
    mock.executeAgent.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishOld = resolve;
        }),
    );
    mock.executeAgent.mockResolvedValueOnce({ output: 'new answer' });

    const wrapper = shallowMount(ChatModal);
    const view = wrapper.vm as unknown as ChatView;
    await mock.onOpenChange?.(true);
    view.prompt = 'old question';
    const oldRequest = view.onSend();
    await mock.onOpenChange?.(false);
    await mock.onOpenChange?.(true);
    view.prompt = 'new question';
    await view.onSend();

    finishOld({ output: 'old answer' });
    await oldRequest;
    expect(view.response).toBe('new answer');
    wrapper.unmount();
  });
});
