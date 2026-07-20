<script lang="ts" setup>
import type { AnalyticsApi } from '#/api';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Card,
  Col,
  Descriptions,
  InputNumber,
  Row,
  Statistic,
  Table,
  Tag,
} from 'antdv-next';

import { getAbilityRadar, getOverview, getTrend, getWeakPoints } from '#/api';
import { $t } from '#/locales';

const studentId = ref(1);

const overview = ref<AnalyticsApi.Overview>();
const abilityRadar = ref<AnalyticsApi.AbilityRadar>();
const weakPoints = ref<AnalyticsApi.WeakPoint[]>([]);
const trend = ref<AnalyticsApi.Trend>();
const loading = ref(false);

const abilityColors: Record<string, string> = {
  memory: '#1890ff',
  understanding: '#52c41a',
  application: '#faad14',
  analysis: '#f5222d',
  evaluation: '#722ed1',
  creation: '#13c2c2',
};

async function loadData() {
  if (!studentId.value) return;
  loading.value = true;
  try {
    const [overviewRes, weakPointsRes, trendRes, abilityRes] =
      await Promise.all([
        getOverview(studentId.value),
        getWeakPoints(studentId.value),
        getTrend(studentId.value),
        getAbilityRadar(studentId.value, 0),
      ]);
    overview.value = overviewRes as any;
    weakPoints.value = weakPointsRes as any;
    trend.value = trendRes as any;
    abilityRadar.value = abilityRes as any;
  } finally {
    loading.value = false;
  }
}

function handleStudentChange(val: number | null) {
  if (val) {
    studentId.value = val;
    loadData();
  }
}

function getAbilityPercent(key: string): string {
  if (!abilityRadar.value?.abilities) return '0%';
  const val = abilityRadar.value.abilities[key];
  return val != null ? `${(val * 100).toFixed(0)}%` : '0%';
}

onMounted(loadData);
</script>

<template>
  <Page>
    <div class="mb-4 flex items-center gap-3">
      <span>{{ $t('education.studyPlan.studentId') }}：</span>
      <InputNumber
        :min="1"
        :value="studentId"
        style="width: 120px"
        @change="handleStudentChange"
      />
    </div>

    <Row :gutter="[16, 16]">
      <!-- 学习概览 -->
      <Col :span="24">
        <Card :bordered="false" :title="$t('education.analytics.overview')">
          <Row :gutter="[16, 16]" v-if="overview">
            <Col :span="6">
              <Statistic
                :title="$t('education.analytics.totalStudyDays')"
                :value="overview.totalStudyDays"
              />
            </Col>
            <Col :span="6">
              <Statistic
                :title="$t('education.analytics.streakDays')"
                :value="overview.streakDays"
                :value-style="{ color: overview.streakDays > 7 ? '#52c41a' : undefined }"
                suffix="天"
              />
            </Col>
            <Col :span="6">
              <Statistic
                :title="$t('education.analytics.totalKnowledge')"
                :value="overview.totalKnowledge"
                :suffix="`/ ${overview.masteredKnowledge} ${$t('education.analytics.masteredKnowledge')}`"
              />
            </Col>
            <Col :span="6">
              <Statistic
                :title="$t('education.analytics.accuracy')"
                :value="(overview.accuracy * 100).toFixed(1)"
                suffix="%"
                :precision="1"
              />
            </Col>
          </Row>
        </Card>
      </Col>

      <!-- 能力雷达 -->
      <Col :span="12">
        <Card :bordered="false" :title="$t('education.analytics.abilityRadar')">
          <Descriptions v-if="abilityRadar" :column="1" size="small">
            <Descriptions.Item
              v-for="(color, key) in abilityColors"
              :key="key"
            >
              <template #label>
                <Tag :color="color">{{ key }}</Tag>
              </template>
              {{ getAbilityPercent(key) }}
            </Descriptions.Item>
            <Descriptions.Item :label="$t('education.analytics.overallMastery')">
              <strong>{{ abilityRadar.overallMastery != null ? `${(abilityRadar.overallMastery * 100).toFixed(0)}%` : '-' }}</strong>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>

      <!-- 薄弱知识点 -->
      <Col :span="12">
        <Card :bordered="false" :title="$t('education.analytics.weakPoints')">
          <Table
            v-if="weakPoints.length > 0"
            :data-source="weakPoints"
            :columns="[
              { title: $t('education.reviewTask.knowledgeName'), dataIndex: 'knowledgeName', key: 'knowledgeName' },
              { title: $t('education.analytics.weakMastery'), dataIndex: 'mastery', key: 'mastery' },
            ]"
            :pagination="false"
            size="small"
            row-key="knowledgeId"
          >
            <template #bodyCell="{ column, text, record }">
              <template v-if="column.dataIndex === 'mastery'">
                <Tag :color="(record.mastery * 100) < 40 ? 'red' : 'orange'">
                  {{ (record.mastery * 100).toFixed(0) }}%
                </Tag>
              </template>
            </template>
          </Table>
          <div v-else class="text-secondary py-4 text-center">
            暂无薄弱知识点
          </div>
        </Card>
      </Col>

      <!-- 学习趋势 -->
      <Col :span="24">
        <Card :bordered="false" :title="$t('education.analytics.trend')">
          <Table
            v-if="trend && trend.dates.length > 0"
            :data-source="trend.dates.map((d, i) => ({ date: d, count: trend.values[i] }))"
            :columns="[
              { title: '日期', dataIndex: 'date', key: 'date', width: 200 },
              { title: $t('education.analytics.totalQuestions'), dataIndex: 'count', key: 'count' },
            ]"
            :pagination="false"
            size="small"
            row-key="date"
          />
          <div v-else class="text-secondary py-4 text-center">
            暂无学习趋势数据
          </div>
        </Card>
      </Col>
    </Row>
  </Page>
</template>
