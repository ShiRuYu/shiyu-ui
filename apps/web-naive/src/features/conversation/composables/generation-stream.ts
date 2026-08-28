import { ref } from 'vue';

import {
  cancelRuntimeRun,
  getRuntimeRunEvents,
  streamGenerationRuntimeEvents,
} from '#/features/agent';
import type { AiRunEvent, RuntimeMode } from '#/features/agent';
import {
  cancelGeneration,
  chatStream,
  retryGeneration as retryGenerationRequest,
  streamGeneration,
} from '#/features/conversation/api/chat';
import type { ChatApi } from '#/features/conversation/api/chat';

export interface GenerationStreamHandlers {
  onChunk?: (chunk: string) => void;
  onReasoning?: (delta: string) => void;
  onRunId?: (runId: string) => void;
  onRuntimeEvent?: (event: AiRunEvent) => void;
  onRuntimeEvents?: (events: AiRunEvent[]) => void;
  onRuntimeReset?: () => void;
}

/** Owns cancellation, streaming, and runtime trace loading for the chat page. */
export function useGenerationStream() {
  const loading = ref(false);
  const activeRunId = ref<string>();
  let controller: AbortController | undefined;

  async function start(
    request: ChatApi.ChatRequest,
    mode: RuntimeMode,
    handlers: GenerationStreamHandlers = {},
  ) {
    begin();
    try {
      const generationId = await chatStream(
        request,
        handlers.onChunk ?? (() => {}),
        {
          signal: controller?.signal,
          onEvent: (event) => {
            if (event.type === 'REASONING_DELTA' && event.reasoningContent) {
              handlers.onReasoning?.(event.reasoningContent);
            }
          },
          onRunId: (runId) => {
            activeRunId.value = runId;
            handlers.onRunId?.(runId);
          },
        },
      );
      activeRunId.value ??= generationId;
      handlers.onRuntimeReset?.();
      try {
        if (mode === 'agent') {
          handlers.onRuntimeEvents?.(
            (await getRuntimeRunEvents(generationId)) ?? [],
          );
        } else {
          await streamGenerationRuntimeEvents(
            generationId,
            handlers.onRuntimeEvent ?? (() => {}),
            controller?.signal,
          );
        }
      } catch {
        // Runtime tracing is observational and must not turn a completed chat into an error.
      }
    } finally {
      finish();
    }
  }

  async function retry(
    messageId: string,
    request: { model?: string; platform?: string },
    handlers: GenerationStreamHandlers = {},
  ) {
    begin();
    try {
      const run = await retryGenerationRequest(messageId, request);
      activeRunId.value = run.id;
      handlers.onRunId?.(run.id);
      await streamGeneration(
        run.id,
        handlers.onChunk ?? (() => {}),
        controller?.signal,
      );
    } finally {
      finish();
    }
  }

  async function stop(mode: RuntimeMode) {
    const runId = activeRunId.value;
    if (runId) {
      try {
        if (mode === 'agent') await cancelRuntimeRun(runId);
        else await cancelGeneration(runId);
      } catch {
        // Local abort still releases the UI when cancellation persistence fails.
      }
    }
    controller?.abort();
  }

  function dispose() {
    controller?.abort();
  }

  function begin() {
    if (loading.value) throw new Error('generation already in progress');
    loading.value = true;
    controller = new AbortController();
    activeRunId.value = undefined;
  }

  function finish() {
    loading.value = false;
    controller = undefined;
    activeRunId.value = undefined;
  }

  return { activeRunId, dispose, loading, retry, start, stop };
}
