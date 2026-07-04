<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import { NCard, NEmpty, NSelect, NSpace, NSpin } from 'naive-ui';

import { getKnowledgeGraphApi, getKnowledgeListApi } from '#/api/knowledge';

const knowledgeOptions = ref<{ label: string; value: number }[]>([]);
const selectedId = ref<null | number>(null);
const graphData = ref<null | { edges: any[]; nodes: any[]; }>(null);
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
    const res = await getKnowledgeGraphApi(selectedId.value);
    graphData.value = res || null;
    await nextTick();
    if (graphData.value) renderGraph();
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

  const w = canvas.width;
  const h = canvas.height;
  const centerX = w / 2;
  const centerY = h / 2;
  const radius = Math.min(w, h) * 0.35;

  ctx.clearRect(0, 0, w, h);

  // Place nodes in a circle
  const positions = nodes.map((_: any, i: number) => ({
    x:
      centerX +
      radius * Math.cos((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    y:
      centerY +
      radius * Math.sin((2 * Math.PI * i) / nodes.length - Math.PI / 2),
    label: _.name || _.id,
  }));

  // Draw edges
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 1;
  if (edges) {
    edges.forEach((e: any) => {
      const s = positions.find(
        (p: any) => p.label === (e.sourceId || e.source),
      );
      const t = positions.find(
        (p: any) => p.label === (e.targetId || e.target),
      );
      if (s && t) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(t.x, t.y);
        ctx.stroke();
        // Draw arrow
        const angle = Math.atan2(t.y - s.y, t.x - s.x);
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(
          t.x - 10 * Math.cos(angle - 0.3),
          t.y - 10 * Math.sin(angle - 0.3),
        );
        ctx.lineTo(
          t.x - 10 * Math.cos(angle + 0.3),
          t.y - 10 * Math.sin(angle + 0.3),
        );
        ctx.closePath();
        ctx.fillStyle = '#aaa';
        ctx.fill();
      }
    });
  }

  // Draw nodes
  positions.forEach((p: any) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#18a058';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.label || '').substring(0, 6), p.x, p.y);
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
        <div v-if="graphData" class="graph-container">
          <canvas
            ref="canvasRef"
            width="800"
            height="500"
            class="graph-canvas"
          ></canvas>
        </div>
        <NEmpty v-else :description="$t('knowledge.viewGraph')" />
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
  max-width: 100%;
}
</style>
