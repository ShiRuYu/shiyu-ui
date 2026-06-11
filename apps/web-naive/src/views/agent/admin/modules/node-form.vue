<script lang="ts" setup>
import type { AgentGraphApi } from '#/api/agent/graph';
import type { NodeTypeApi } from '#/api/agent/node-type';

import { computed } from 'vue';

import { NCheckbox, NInput, NInputNumber, NSelect } from 'naive-ui';

const props = defineProps<{
  nodeData: AgentGraphApi.FormNode;
  nodeTypeMeta: NodeTypeApi.NodeTypeMetaVO[];
}>();

const emit = defineEmits<{
  (e: 'update:nodeData', val: AgentGraphApi.FormNode): void;
}>();

const currentTypeMeta = computed(() =>
  props.nodeTypeMeta.find((nt) => nt.code === props.nodeData.nodeType),
);

const fieldSchemas = computed(() => currentTypeMeta.value?.fields || []);

function updateField(key: string, value: any) {
  const cfg = { ...props.nodeData.config, [key]: value };
  emit('update:nodeData', { ...props.nodeData, config: cfg });
}

function getConfigValue(key: string): any {
  return props.nodeData.config?.[key];
}

function setPartial(partial: Partial<AgentGraphApi.FormNode>) {
  emit('update:nodeData', { ...props.nodeData, ...partial });
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div>
      <label class="mb-1 block text-xs">节点名称</label>
      <NInput
        :value="nodeData.nodeName"
        size="small"
        @update:value="(v: string) => setPartial({ nodeName: v })"
      />
    </div>

    <div>
      <label class="mb-1 block text-xs">节点类型</label>
      <NSelect
        :value="nodeData.nodeType"
        :options="
          nodeTypeMeta.map((nt) => ({ label: nt.name, value: nt.code }))
        "
        size="small"
        @update:value="(v: string) => setPartial({ nodeType: v })"
      />
    </div>

    <div>
      <label class="mb-1 block text-xs">描述</label>
      <NInput
        :value="nodeData.description"
        size="small"
        type="textarea"
        :autosize="{ minRows: 2, maxRows: 4 }"
        @update:value="(v: string) => setPartial({ description: v })"
      />
    </div>

    <NCheckbox
      :checked="nodeData.enabled !== false"
      @update:checked="(v: boolean) => setPartial({ enabled: v })"
    >
      启用
    </NCheckbox>

    <div v-if="fieldSchemas.length > 0">
      <div class="mb-2 text-xs font-bold">配置参数</div>
      <div v-for="field in fieldSchemas" :key="field.key" class="mb-2">
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
  </div>
</template>
