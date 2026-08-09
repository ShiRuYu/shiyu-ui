import { describe, expect, it } from 'vitest';

import { renderSafeMarkdown } from '../markdown';

describe('renderSafeMarkdown', () => {
  it('renders chat formatting and escapes model-provided html', () => {
    const result = renderSafeMarkdown(
      '**answer**\n```ts\nconst ok = true;\n```\n<script>alert(1)</script>',
    );

    expect(result).toContain('<strong>answer</strong>');
    expect(result).toContain('<pre><code class="language-ts">');
    expect(result).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(result).not.toContain('<script>');
  });
});
