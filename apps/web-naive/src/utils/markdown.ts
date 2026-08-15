function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderInline(value: string): string {
  return value
    .replaceAll(/`([^`]+)`/g, '<code>$1</code>')
    .replaceAll(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replaceAll(/\*([^*]+)\*/g, '<em>$1</em>');
}

/**
 * Render the small, safe Markdown subset used by streamed chat responses.
 * Input is escaped before any tags are introduced, so model output cannot
 * inject script or arbitrary HTML.
 */
function renderSafeMarkdown(markdown: string): string {
  const escaped = escapeHtml(markdown);
  const codeBlocks: string[] = [];
  const withPlaceholders = escaped.replaceAll(
    /```([\w-]*)\n?([\s\S]*?)```/g,
    (_match, language: string, code: string) => {
      const index = codeBlocks.length;
      const languageClass = language ? ` class="language-${language}"` : '';
      codeBlocks.push(
        `<pre><code${languageClass}>${code.trimEnd()}</code></pre>`,
      );
      return `\u0000CODE${index}\u0000`;
    },
  );

  let html = renderInline(withPlaceholders).replaceAll('\n', '<br>');
  codeBlocks.forEach((block, index) => {
    html = html.replace(`\u0000CODE${index}\u0000`, block);
  });
  return html;
}

export { renderSafeMarkdown };
