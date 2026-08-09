<script lang="ts" setup>
import {
  NButton,
  NForm,
  NFormItemGi,
  NGi,
  NGrid,
  NInput,
  NSelect,
} from 'naive-ui';

import { $t } from '#/locales';

defineProps<{
  agentIdDisabled?: boolean;
  readonly?: boolean;
  saveLabel: string;
  statusOptions: Array<{ label: string; value: number }>;
}>();

defineEmits<{ save: [] }>();
const agentId = defineModel<string>('agentId', { required: true });
const name = defineModel<string>('name', { required: true });
const description = defineModel<string>('description', { required: true });
const status = defineModel<number>('status', { required: true });
</script>

<template>
  <NForm label-placement="top" label-width="auto">
    <NGrid :cols="1" :x-gap="12">
      <NGi>
        <NFormItemGi :label="$t('agent.adminEditAgentId')">
          <NInput
            v-model:value="agentId"
            :disabled="readonly || agentIdDisabled"
            :placeholder="
              agentIdDisabled
                ? $t('agent.adminEditAgentIdPlaceholderReadonly')
                : $t('agent.adminEditAgentIdPlaceholder')
            "
          />
        </NFormItemGi>
      </NGi>
      <NGi>
        <NFormItemGi :label="$t('agent.adminEditName')">
          <NInput
            v-model:value="name"
            :disabled="readonly"
            :placeholder="$t('agent.adminEditNamePlaceholder')"
          />
        </NFormItemGi>
      </NGi>
      <NGi>
        <NFormItemGi :label="$t('agent.description')">
          <NInput
            v-model:value="description"
            :disabled="readonly"
            :maxlength="500"
            :rows="2"
            :placeholder="$t('agent.adminEditDescriptionPlaceholder')"
            type="textarea"
          />
        </NFormItemGi>
      </NGi>
      <NGi>
        <NFormItemGi :label="$t('agent.adminEditStatus')">
          <NSelect
            v-model:value="status"
            :disabled="readonly"
            :options="statusOptions"
          />
        </NFormItemGi>
      </NGi>
    </NGrid>
    <NButton v-if="!readonly" type="primary" @click="$emit('save')">
      {{ saveLabel }}
    </NButton>
  </NForm>
</template>
