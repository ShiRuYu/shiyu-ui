<script lang="ts" setup>
import type { AgentGraphApi } from '#/api/agent/graph';
import type { NodeTypeApi } from '#/api/agent/node-type';

import { computed, ref, watch } from 'vue';

import { NButton, NCheckbox, NInput, NInputNumber, NSelect } from 'naive-ui';

import { requestClient } from '#/api/request';
import { getDictByType } from '#/api/system/dict';

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

function updateCommon(
  key:
    | 'errorStrategy'
    | 'logLevel'
    | 'retryCount'
    | 'retryInterval'
    | 'timeout',
  value: any,
) {
  emit('update:nodeData', { ...props.nodeData, [key]: value });
}

const advancedConfigText = ref('{}');
const advancedConfigError = ref('');

watch(
  () => props.nodeData.config,
  (config) => {
    advancedConfigText.value = JSON.stringify(config ?? {}, null, 2);
    advancedConfigError.value = '';
  },
  { deep: true, immediate: true },
);

function applyAdvancedConfig() {
  try {
    const parsed = JSON.parse(advancedConfigText.value || '{}');
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error('JSON 配置必须是对象');
    }
    advancedConfigError.value = '';
    emit('update:nodeData', { ...props.nodeData, config: parsed });
  } catch (error) {
    advancedConfigError.value =
      error instanceof Error ? error.message : 'JSON 格式不正确';
  }
}

// ---------- API/Dict field rendering ----------

const apiOptionsCache = ref<
  Record<string, Array<{ label: string; value: any }>>
>({});

function buildUrl(url: string): string {
  return url.replaceAll(/\{(\w+)\}/g, (_: string, key: string) => {
    return props.nodeData.config?.[key] ?? '';
  });
}

function normalizeSource(
  field: NodeTypeApi.FieldMeta,
): NodeTypeApi.DataSourceConfig | undefined {
  if (!field.source) return undefined;
  if (typeof field.source !== 'string') return field.source;
  const text = field.source.replace(/^@\{|\}$/g, '');
  const values: Record<string, string> = {};
  for (const item of text.split(';')) {
    const [key, ...rest] = item.split('=');
    if (key) values[key.trim()] = rest.join('=').trim();
  }
  if (!values.type) return undefined;
  return {
    type: values.type as 'api' | 'dict',
    url: values.url || undefined,
    dictType: values.dictType || undefined,
    labelKey: values.labelKey || undefined,
    valueKey: values.valueKey || undefined,
    dependsOn: values.dependsOn || undefined,
  };
}

async function loadApiOptions(field: NodeTypeApi.FieldMeta) {
  const src = normalizeSource(field);
  if (!src) return;
  const cacheKey = field.key;
  let options: Array<{ label: string; value: any }> = [];

  if (src.type === 'dict' && src.dictType) {
    try {
      const res: any = await getDictByType(src.dictType);
      const items = Array.isArray(res) ? res : (res?.data ?? []);
      options = items.map((item: any) => ({
        label: src.labelKey ? item[src.labelKey] : item.dictLabel,
        value: src.valueKey ? item[src.valueKey] : item.dictValue,
      }));
    } catch {
      /* ignore */
    }
  } else if (src.type === 'api' && src.url) {
    const resolvedUrl = buildUrl(src.url);
    try {
      const res: any = await requestClient.get(resolvedUrl);
      const items = Array.isArray(res) ? res : (res?.data ?? []);
      options = items.map((item: any) => ({
        label: src.labelKey ? item[src.labelKey] : item.name,
        value: src.valueKey ? item[src.valueKey] : item.id,
      }));
    } catch {
      /* ignore */
    }
  }

  apiOptionsCache.value[cacheKey] = options;
}

// Load non-dependent fields on mount
watch(
  fieldSchemas,
  (schemas) => {
    for (const f of schemas) {
      const source = normalizeSource(f);
      if (source && !source.dependsOn) {
        loadApiOptions(f);
      }
    }
  },
  { immediate: true },
);

// Watch dependencies for cascade reload
watch(
  () => props.nodeData.config,
  (cfg) => {
    if (!cfg) return;
    for (const f of fieldSchemas.value) {
      const source = normalizeSource(f);
      if (source?.dependsOn && source.dependsOn in cfg) {
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
  if (normalizeSource(field)) {
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

    <div class="grid grid-cols-2 gap-2">
      <div>
        <label class="mb-1 block text-xs">超时（毫秒）</label>
        <NInputNumber
          :value="nodeData.timeout ?? 30000"
          :min="0"
          size="small"
          @update:value="(v: number | null) => updateCommon('timeout', v ?? 0)"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs">重试次数</label>
        <NInputNumber
          :value="nodeData.retryCount ?? 0"
          :min="0"
          size="small"
          @update:value="
            (v: number | null) => updateCommon('retryCount', v ?? 0)
          "
        />
      </div>
      <div>
        <label class="mb-1 block text-xs">重试间隔（毫秒）</label>
        <NInputNumber
          :value="nodeData.retryInterval ?? 1000"
          :min="0"
          size="small"
          @update:value="
            (v: number | null) => updateCommon('retryInterval', v ?? 0)
          "
        />
      </div>
      <div>
        <label class="mb-1 block text-xs">异常策略</label>
        <NSelect
          :value="nodeData.errorStrategy ?? 'THROW'"
          size="small"
          :options="[
            { label: '抛出异常', value: 'THROW' },
            { label: '继续执行', value: 'CONTINUE' },
          ]"
          @update:value="(v: string) => updateCommon('errorStrategy', v)"
        />
      </div>
      <div>
        <label class="mb-1 block text-xs">日志级别</label>
        <NSelect
          :value="nodeData.logLevel ?? 'INFO'"
          size="small"
          :options="
            ['DEBUG', 'INFO', 'WARN', 'ERROR'].map((value) => ({
              label: value,
              value,
            }))
          "
          @update:value="(v: string) => updateCommon('logLevel', v)"
        />
      </div>
    </div>

    <div v-if="fieldSchemas.length > 0">
      <div class="mb-2 text-xs font-bold">配置参数</div>
      <div v-for="field in fieldSchemas" :key="field.key" class="mb-2">
        <label class="mb-1 block text-xs">{{ field.label || field.key }}</label>
        <NSelect
          v-if="normalizeSource(field) || field.options"
          :value="getConfigValue(field.key) ?? field.defaultValue"
          :options="getFieldOptions(field)"
          :loading="
            normalizeSource(field) &&
            !apiOptionsCache[field.key] &&
            !normalizeSource(field)?.dependsOn
          "
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
        <NCheckbox
          v-else-if="field.type === 'boolean'"
          :checked="getConfigValue(field.key) ?? field.defaultValue ?? false"
          @update:checked="(v: boolean) => updateField(field.key, v)"
        >
          {{ field.label || field.key }}
        </NCheckbox>
        <NInput
          v-else-if="field.type === 'textarea'"
          type="textarea"
          :autosize="{ minRows: 2, maxRows: 6 }"
          :value="getConfigValue(field.key) ?? field.defaultValue"
          size="small"
          @update:value="(v: string) => updateField(field.key, v)"
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

    <div>
      <div class="mb-2 text-xs font-bold">高级 JSON 配置</div>
      <NInput
        v-model:value="advancedConfigText"
        type="textarea"
        :autosize="{ minRows: 4, maxRows: 10 }"
        size="small"
        placeholder="请输入节点专属 JSON 配置"
      />
      <div v-if="advancedConfigError" class="mt-1 text-xs text-red-500">
        {{ advancedConfigError }}
      </div>
      <NButton class="mt-2" size="tiny" secondary @click="applyAdvancedConfig">
        应用 JSON 配置
      </NButton>
    </div>
  </div>
</template>
