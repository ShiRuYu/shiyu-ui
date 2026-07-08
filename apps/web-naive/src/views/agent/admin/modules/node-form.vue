<script lang="ts" setup>
import type { AgentGraphApi } from '#/api/agent/graph';
import type { NodeTypeApi } from '#/api/agent/node-type';

import { computed, ref, watch } from 'vue';

import { NCheckbox, NInput, NInputNumber, NSelect } from 'naive-ui';

import { getDictByType } from '#/api/common/dict';
import { requestClient } from '#/api/request';

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

// ---------- API/Dict field rendering ----------

const apiOptionsCache = ref<Record<string, Array<{ label: string; value: any }>>>({});

function buildUrl(url: string): string {
  return url.replace(/\{(\w+)\}/g, (_: string, key: string) => {
    return props.nodeData.config?.[key] ?? '';
  });
}

async function loadApiOptions(field: NodeTypeApi.FieldMeta) {
  const src = field.source;
  if (!src) return;
  const cacheKey = field.key;
  let options: Array<{ label: string; value: any }> = [];

  if (src.type === 'dict' && src.dictType) {
    try {
      const res: any = await getDictByType(src.dictType);
      const items = Array.isArray(res) ? res : res?.data ?? [];
      options = items.map((item: any) => ({
        label: src.labelKey ? item[src.labelKey] : item.dictLabel,
        value: src.valueKey ? item[src.valueKey] : item.dictValue,
      }));
    } catch { /* ignore */ }
  } else if (src.type === 'api' && src.url) {
    const resolvedUrl = buildUrl(src.url);
    try {
      const res: any = await requestClient.get(resolvedUrl);
      const items = Array.isArray(res) ? res : res?.data ?? [];
      options = items.map((item: any) => ({
        label: src.labelKey ? item[src.labelKey] : item.name,
        value: src.valueKey ? item[src.valueKey] : item.id,
      }));
    } catch { /* ignore */ }
  }

  apiOptionsCache.value[cacheKey] = options;
}

// Load non-dependent fields on mount
watch(fieldSchemas, (schemas) => {
  for (const f of schemas) {
    if (f.source && !f.source.dependsOn) {
      loadApiOptions(f);
    }
  }
}, { immediate: true });

// Watch dependencies for cascade reload
watch(
  () => props.nodeData.config,
  (cfg) => {
    if (!cfg) return;
    for (const f of fieldSchemas.value) {
      if (f.source?.dependsOn && f.source.dependsOn in cfg) {
        loadApiOptions(f);
        // If current value is not in new options, clear it
        const currentVal = getConfigValue(f.key);
        if (currentVal !== undefined && currentVal !== '') {
          const opts = apiOptionsCache.value[f.key];
          if (opts && !opts.some((o) => o.value === currentVal)) {
            updateField(f.key, '');
          }
        }
      }
    }
  },
  { deep: true },
);

function getFieldOptions(field: NodeTypeApi.FieldMeta) {
  if (field.source) {
    return apiOptionsCache.value[field.key] || [];
  }
  if (field.options) {
    return Object.entries(field.options).map(([k, v]) => ({
      label: String(v),
      value: k,
    }));
  }
  return [];
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
          v-if="field.source || field.options"
          :value="getConfigValue(field.key) ?? field.defaultValue"
          :options="getFieldOptions(field)"
          :loading="field.source && !apiOptionsCache[field.key] && !field.source.dependsOn"
          size="small"
          :placeholder="field.description || '请选择'"
          :clearable="true"
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
