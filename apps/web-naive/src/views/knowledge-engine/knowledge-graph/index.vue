<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NEmpty, NSelect, NSpace, NSpin } from 'naive-ui';

import { getKnowledgeGraphApi, getKnowledgeListApi } from '#/api/knowledge';

const knowledgeOptions = ref<{ label: string; value: number }[]>([]);
const selectedId = ref<null | number>(null);
const graphData = ref<null | { edges: any[]; nodes: any[] }>(null);
const loading = ref(false);
const canvasRef = ref<HTMLCanvasElement | null>(null);

async function loadOptions() {
  const list = await getKnowledgeListApi();
  knowledgeOptions.value = (list || []).map((k: any) => ({
    label: `[${k.code}] ${k.name}`,
    value: k.id,
  }));
}

async function loadGraph() {
  if (!selectedId.value) return;
  loading.value = true;
  try {
    // 后端返回 KnowledgeGraphResponse { node, parentNodes, childNodes, relatedNodes }
    const res: any = await getKnowledgeGraphApi(selectedId.value);
    if (!res) {
      graphData.value = null;
      return;
    }

    // 转换为前端需要的 { nodes, edges } 格式
    const nodes: any[] = [];
    const edges: any[] = [];
    const addedIds = new Set<number>();

    // 中心节点
    if (res.node) {
      nodes.push({ id: res.node.id, name: res.node.name, type: 'center' });
      addedIds.add(res.node.id);
    }

    // 前置/父节点 -> 指向中心节点
    (res.parentNodes || []).forEach((n: any) => {
      if (!addedIds.has(n.id)) {
        nodes.push({ id: n.id, name: n.name, type: 'parent' });
        addedIds.add(n.id);
      }
      if (res.node) {
        edges.push({ source: n.name, target: res.node.name, label: '前置' });
      }
    });

    // 后续/子节点 -> 中心节点指向它们
    (res.childNodes || []).forEach((n: any) => {
      if (!addedIds.has(n.id)) {
        nodes.push({ id: n.id, name: n.name, type: 'child' });
        addedIds.add(n.id);
      }
      if (res.node) {
        edges.push({ source: res.node.name, target: n.name, label: '后续' });
      }
    });

    // 相关节点
    (res.relatedNodes || []).forEach((n: any) => {
      if (!addedIds.has(n.id)) {
        nodes.push({ id: n.id, name: n.name, type: 'related' });
        addedIds.add(n.id);
      }
      if (res.node) {
        edges.push({ source: res.node.name, target: n.name, label: '相关' });
      }
    });

    graphData.value = { nodes, edges };
    await nextTick();
    if (graphData.value.nodes?.length) renderGraph();
  } finally {
    loading.value = false;
  }
}

function renderGraph() {
  const canvas = canvasRef.value;
  if (!canvas || !graphData.value) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { nodes, edges } = graphData.value;
  if (!nodes?.length) return;

  // 响应式 canvas 尺寸
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);

  const w = rect.width;
  const h = rect.height;
  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(w, h) * 0.3;

  // 中心节点放中间，其他节点环绕
  const centerNode = nodes.find((n) => n.type === 'center');
  const otherNodes = nodes.filter((n) => n.type !== 'center');

  const positions: Record<string, { x: number; y: number }> = {};
  if (centerNode) {
    positions[centerNode.name] = { x: centerX, y: centerY };
  }
  otherNodes.forEach((n: any, i: number) => {
    const angle = (2 * Math.PI * i) / otherNodes.length - Math.PI / 2;
    positions[n.name] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  });

  // 清空
  ctx.clearRect(0, 0, w, h);

  // 画连线
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  if (edges) {
    edges.forEach((e: any) => {
      const s = positions[e.source];
      const t = positions[e.target];
      if (s && t) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();

        // 小箭头
        const angle = Math.atan2(t.y - s.y, t.x - s.x);
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(t.x - 10 * Math.cos(angle - 0.3), t.y - 10 * Math.sin(angle - 0.3));
        ctx.lineTo(t.x - 10 * Math.cos(angle + 0.3), t.y - 10 * Math.sin(angle + 0.3));
        ctx.closePath();
        ctx.fillStyle = '#aaa';
        ctx.fill();

        // 连线标签
        if (e.label) {
          const mx = (s.x + t.x) / 2;
          const my = (s.y + t.y) / 2;
          ctx.fillStyle = '#666';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(e.label, mx, my - 4);
        }
      }
    });
  }

  // 画节点
  nodes.forEach((n: any) => {
    const p = positions[n.name];
    if (!p) return;
    const nodeRadius = n.type === 'center' ? 28 : 20;
    const color =
      n.type === 'center' ? '#2080f0' : n.type === 'parent' ? '#18a058' : n.type === 'child' ? '#d03050' : '#f0a020';

    ctx.beginPath();
    ctx.arc(p.x, p.y, nodeRadius, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n.name || '').substring(0, 8), p.x, p.y);
  });
}

onMounted(loadOptions);
</script>

<template>
  <Page auto-content-height>
    <NCard :title="$t('knowledge.graph')" :bordered="false">
      <template #header-extra>
        <NSpace>
          <NSelect
            v-model:value="selectedId"
            :options="knowledgeOptions"
            :placeholder="$t('knowledge.viewGraph')"
            filterable
            style="width: 300px"
            @update:value="loadGraph"
          />
        </NSpace>
      </template>

      <NSpin :show="loading">
        <div v-if="graphData?.nodes?.length" class="graph-container">
          <canvas
            ref="canvasRef"
            class="graph-canvas"
            style="width: 100%; height: 500px"
          ></canvas>
        </div>
        <NEmpty v-else-if="!loading" :description="$t('knowledge.viewGraph')" />
      </NSpin>
    </NCard>
  </Page>
</template>

<style scoped>
.graph-container {
  display: flex;
  justify-content: center;
  padding: 16px;
}
.graph-canvas {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}
</style>
