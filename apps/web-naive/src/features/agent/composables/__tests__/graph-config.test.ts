import { describe, expect, it } from 'vitest';

import { buildGraphConfig, parseGraphConfig } from '../graph-config';

describe('agent graph editor mapping', () => {
  it('uses safe empty defaults for missing and partial persisted graphs', () => {
    expect(parseGraphConfig(null)).toEqual({
      endNode: '',
      formEdges: [],
      formNodes: [],
      startNode: '',
    });

    const parsed = parseGraphConfig({
      nodes: { draft: { nodeName: '', nodeType: '' } },
      edges: { draft: [] },
      conditionalEdges: { draft: { conditionType: 'STATUS' } as any },
    });
    expect(parsed.formNodes[0]).toMatchObject({
      id: 'draft',
      nodeName: 'draft',
      enabled: true,
      description: '',
      config: {},
      properties: {},
    });
    expect(parsed.formEdges).toEqual([]);
  });

  it('parses normal and conditional persisted edges', () => {
    const parsed = parseGraphConfig({
      startNode: 'start',
      endNode: 'finish',
      nodes: {
        start: { nodeName: 'Start', nodeType: 'INPUT' },
        finish: { nodeName: 'Finish', nodeType: 'OUTPUT' },
      },
      edges: { start: ['finish'] },
      conditionalEdges: {
        start: {
          conditionType: 'INTENT',
          defaultTarget: 'finish',
          nodeMappings: { review: 'finish' },
        },
      },
    });

    expect(parsed.formNodes).toHaveLength(2);
    expect(parsed.formEdges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'start->finish', edgeType: 'normal' }),
        expect.objectContaining({
          id: 'start->finish__cond_default',
          isDefault: true,
        }),
        expect.objectContaining({
          conditionMapping: 'review',
          isDefault: false,
        }),
      ]),
    );
    expect(parsed.startNode).toBe('start');
    expect(parsed.endNode).toBe('finish');
  });

  it('serializes editor nodes and edges without losing conditional mappings', () => {
    const graph = buildGraphConfig(
      'Tutor',
      [
        {
          id: 'start',
          nodeName: 'Start',
          nodeType: 'INPUT',
          enabled: true,
          description: '',
          config: {},
        },
        {
          id: 'finish',
          nodeName: 'Finish',
          nodeType: 'OUTPUT',
          enabled: true,
          description: '',
          config: {},
        },
      ],
      [
        {
          id: 'start->finish',
          source: 'start',
          target: 'finish',
          edgeType: 'normal',
        },
        {
          id: 'start->finish__cond_default',
          source: 'start',
          target: 'finish',
          edgeType: 'conditional',
          conditionType: 'INTENT',
          isDefault: true,
        },
        {
          id: 'start->finish__cond_review',
          source: 'start',
          target: 'finish',
          edgeType: 'conditional',
          conditionType: 'INTENT',
          conditionMapping: 'review',
          isDefault: false,
        },
      ],
      'start',
      'finish',
    );

    expect(graph).toMatchObject({
      name: 'Tutor',
      startNode: 'start',
      endNode: 'finish',
      edges: { start: ['finish'] },
      conditionalEdges: {
        start: {
          conditionType: 'INTENT',
          defaultTarget: 'finish',
          nodeMappings: { review: 'finish' },
        },
      },
    });
  });

  it('derives endpoints and preserves disabled nodes when omitted explicitly', () => {
    expect(buildGraphConfig('Empty', [], [])).toMatchObject({
      startNode: '',
      endNode: '',
      nodes: {},
      edges: {},
      conditionalEdges: {},
    });
    const result = buildGraphConfig(
      'Draft',
      [
        {
          id: 'only',
          nodeName: '',
          nodeType: '',
          enabled: false,
          description: '',
          config: {},
        },
      ],
      [
        {
          id: 'only->target',
          source: 'only',
          target: 'target',
          edgeType: 'conditional',
          conditionType: '',
          isDefault: false,
        },
      ],
    );
    expect(result.startNode).toBe('only');
    expect(result.endNode).toBe('only');
    expect(result.nodes.only).toMatchObject({
      nodeName: 'only',
      nodeType: '',
      enabled: false,
    });
    expect(result.conditionalEdges.only).toMatchObject({
      conditionType: '',
      defaultTarget: '',
      nodeMappings: {},
    });
  });
});
