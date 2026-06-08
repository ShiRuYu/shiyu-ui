<script lang="ts" setup>
import type { NodeTypeApi } from '#/api/agent/node-type';
import type { Node } from '@vue-flow/core';

import { computed, watch } from 'vue';

import { NButton, NCheckbox, NInput, NInputNumber, NSelect, NSpace } from 'naive-ui';

const props = defineProps<{
  selectedNode: Node;
  nodeTypeMeta: NodeTypeApi.NodeTypeMetaVO[];
}>();

const emit = defineEmits(['close', 'update']);

const nodeData = computed(() => props.selectedNode.data || {});
const currentTypeMeta = computed(() =>
  props.nodeTypeMeta.find((nt) => nt.code === nodeData.value.nodeType),
);

const fieldSchemas = computed(() => currentTypeMeta.value?.fields || []);

function updateField(key: string, value: any) {
  if (!nodeData.value.config) {
    nodeData.value.config = {};
  }
  nodeData.value.config[key] = value;
}

function getConfigValue(key: string): any {
  return nodeData.value.config?.[key];
}

watch(
  () => props.selectedNode.id,
  () => {
    // reset when node changes
  },
);
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex items-center justify-between">
      <span class="font-bold">节点属性</span>
      <NButton size="tiny" @click="emit('close')">X</NButton>
    </div>

    <div class="text-xs text-gray-500">ID: {{ selectedNode.id }}</div>

    <div>
      <label class="mb-1 block text-xs">节点名称</label>
      <NInput
        :value="nodeData.nodeName"
        size="small"
        @update:value="(v: string) => (nodeData.nodeName = v)"
      />
    </div>

    <div>
      <label class="mb-1 block text-xs">节点类型</label>
      <NSelect
        :value="nodeData.nodeType"
        :options="nodeTypeMeta.map((nt) => ({ label: nt.name, value: nt.code }))"
        size="small"
        @update:value="(v: string) => (nodeData.nodeType = v)"
      />
    </div>

    <div>
      <label class="mb-1 block text-xs">描述</label>
      <NInput
        :value="nodeData.description"
        size="small"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 4 }"
        @update:value="(v: string) => (nodeData.description = v)"
      />
    </div>

    <NCheckbox
      :checked="nodeData.enabled !== false"
      @update:checked="(v: boolean) => (nodeData.enabled = v)"
    >
      启用
    </NCheckbox>

    <div v-if="fieldSchemas.length > 0">
      <div class="mb-2 text-xs font-bold">配置参数</div>
      <div
        v-for="field in fieldSchemas"
        :key="field.key"
        class="mb-2"
      >
        <label class="mb-1 block text-xs">{{ field.label || field.key }}</label>
        <NSelect
          v-if="field.options"
          :value="getConfigValue(field.key) ?? field.defaultValue"
          :options="
            Object.entries(field.options).map(([k, v]) => ({
              label: String(v),
              value: k,
            }))
          "
          size="small"
          @update:value="(v: any) => updateField(field.key, v)"
        />
        <NInputNumber
          v-else-if="field.type === 'number'"
          :value="getConfigValue(field.key) ?? field.defaultValue"
          size="small"
          @update:value="(v: any) => updateField(field.key, v)"
        />
        <NInput
          v-else
          :value="getConfigValue(field.key) ?? field.defaultValue"
          size="small"
          @update:value="(v: any) => updateField(field.key, v)"
        />
        <div v-if="field.description" class="mt-1 text-xs text-gray-400">
          {{ field.description }}
        </div>
      </div>
    </div>

    <NSpace>
      <NButton size="small" type="primary" @click="emit('update')">
        应用
      </NButton>
      <NButton size="small" @click="emit('close')"> 取消 </NButton>
    </NSpace>
  </div>
</template>
