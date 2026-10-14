import type { AiRunEvent, RuntimeMode } from '#/features/agent';
import type { ChatApi } from '#/features/conversation/api/chat';

import { ref } from 'vue';

import {
  cancelRuntimeRun,
  cancelRuntimeRunOnUnload,
  getRuntimeRunEvents,
  streamGenerationRuntimeEvents,
} from '#/features/agent';
import {
  cancelGeneration,
  chatStream,
  retryGeneration as retryGenerationRequest,
  streamGeneration,
} from '#/features/conversation/api/chat';

export interface GenerationStreamHandlers {
  onChunk?: (chunk: string) => void;
  onInputMessageId?: (messageId: string) => void;
  onAssistantMessageId?: (messageId: string) => void;
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
  let activeMode: RuntimeMode | undefined;
  let cancelRequested = false;
  let generationFinished = false;

  async function start(
    request: ChatApi.ChatRequest,
    mode: RuntimeMode,
    handlers: GenerationStreamHandlers = {},
  ) {
    begin();
    activeMode = mode;
    try {
      const generationId = await chatStream(
        request,
        handlers.onChunk ?? (() => {}),
        {
          signal: controller?.signal,
          onInputMessageId: handlers.onInputMessageId,
          onAssistantMessageId: handlers.onAssistantMessageId,
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
      generationFinished = true;
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
      const run = await retryGenerationRequest(messageId, request, {
        signal: controller?.signal,
      });
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
    cancelRequested = true;
    controller?.abort();
    if (runId) {
      try {
        if (mode === 'agent') await cancelRuntimeRun(runId);
        else await cancelGeneration(runId);
      } catch {
        // Local abort still releases the UI when cancellation persistence fails.
      }
    }
  }

  function dispose(unloading = false) {
    const runId = activeRunId.value;
    if (
      loading.value &&
      !generationFinished &&
      !cancelRequested &&
      activeMode === 'agent' &&
      runId
    ) {
      cancelRequested = true;
      const cancellation = unloading
        ? cancelRuntimeRunOnUnload(runId)
        : cancelRuntimeRun(runId);
      void cancellation.catch(() => {});
    }
    controller?.abort();
  }

  function begin() {
    if (loading.value) throw new Error('generation already in progress');
    loading.value = true;
    controller = new AbortController();
    activeRunId.value = undefined;
    activeMode = undefined;
    cancelRequested = false;
    generationFinished = false;
  }

  function finish() {
    loading.value = false;
    controller = undefined;
    activeRunId.value = undefined;
    activeMode = undefined;
  }

  return { activeRunId, dispose, loading, retry, start, stop };
}
