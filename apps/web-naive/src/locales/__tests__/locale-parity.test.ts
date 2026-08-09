import { describe, expect, it } from 'vitest';

interface LocaleTree {
  [key: string]: LocaleTree | string;
}

const zhModules = import.meta.glob<LocaleTree>('../langs/zh-CN/*.json', {
  eager: true,
  import: 'default',
});
const enModules = import.meta.glob<LocaleTree>('../langs/en-US/*.json', {
  eager: true,
  import: 'default',
});

function fileName(path: string) {
  return path.split('/').at(-1) ?? path;
}

function flattenKeys(tree: LocaleTree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string' ? [path] : flattenKeys(value, path);
  });
}

function byFile(modules: Record<string, LocaleTree>) {
  return Object.fromEntries(
    Object.entries(modules).map(([path, messages]) => [
      fileName(path),
      flattenKeys(messages).sort(),
    ]),
  );
}

describe('application locale dictionaries', () => {
  it('keeps the same files and message keys in Chinese and English', () => {
    expect(byFile(enModules)).toEqual(byFile(zhModules));
  });
});
