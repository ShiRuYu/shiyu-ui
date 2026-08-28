interface ServerSentEvent {
  data: string;
  event?: string;
  id?: string;
}

function parseEventFrame(frame: string): null | ServerSentEvent {
  const event: ServerSentEvent = { data: '' };
  const dataLines: string[] = [];

  for (const rawLine of frame.split(/\r?\n/)) {
    if (!rawLine || rawLine.startsWith(':')) continue;
    const separator = rawLine.indexOf(':');
    const field = separator === -1 ? rawLine : rawLine.slice(0, separator);
    const value =
      separator === -1 ? '' : rawLine.slice(separator + 1).replace(/^ /, '');

    if (field === 'data') dataLines.push(value);
    if (field === 'event') event.event = value;
    if (field === 'id') event.id = value;
  }

  if (dataLines.length === 0) return null;
  event.data = dataLines.join('\n');
  return event;
}

async function consumeEventStream(
  response: Response,
  onEvent: (event: ServerSentEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  if (!response.ok || !response.body) {
    throw new Error(`Stream error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const abort = () => {
    void reader.cancel();
  };
  signal?.addEventListener('abort', abort, { once: true });

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      const { done, value } = await reader.read();
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
      buffer += decoder.decode(value, { stream: !done });

      const frames = buffer.split(/\r?\n\r?\n/);
      buffer = frames.pop() ?? '';
      for (const frame of frames) {
        const event = parseEventFrame(frame);
        if (event) onEvent(event);
      }

      if (done) break;
    }

    const finalEvent = parseEventFrame(buffer);
    if (finalEvent) onEvent(finalEvent);
  } finally {
    signal?.removeEventListener('abort', abort);
    reader.releaseLock();
  }
}

export { consumeEventStream, parseEventFrame };
export type { ServerSentEvent };
