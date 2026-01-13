<script setup lang="ts">
  import type { PropType } from 'vue';
  import { defineProps } from 'vue';
  import { VRow } from 'vuetify/components';
  import { VcsFormSection } from '@vcmap/ui';
  import type { DataItem } from './webdataConstants.js';
  import WxsInformations from './WxsInformations.vue';
  import { isWxsWebdataType } from './webdataHelper.js';

  defineProps({
    item: { type: Object as PropType<DataItem>, required: true },
    title: {
      type: String,
      default: (rawProps: { item: DataItem }) =>
        `dynamicLayer.webdata.type.${rawProps.item.type}`,
    },
    subtitle: { type: String, default: '' },
    startOpen: { type: Boolean, default: false },
  });
</script>

<template>
  <div class="h-100">
    <v-row no-gutters class="title pt-1">{{ $t(title) }}</v-row>
    <v-row no-gutters class="subtitle">{{ subtitle }} &nbsp;</v-row>
    <VcsFormSection
      heading="dynamicLayer.info.title"
      expandable
      :start-open="startOpen"
      class="h-100 section"
    >
      <div class="h-100 overflow-y-auto pb-2">
        <WxsInformations v-if="isWxsWebdataType(item)" :item="item" />
        <span v-else class="pa-1">
          {{ $t('dynamicLayer.info.noInfoFor') }} {{ item.type }}
          {{ $t('dynamicLayer.common.layers') }}.
        </span>
      </div>
    </VcsFormSection>
  </div>
</template>

<style lang="scss" scoped>
  .title {
    font-weight: bold;
    text-decoration: underline;
    display: flex;
    justify-content: center;
  }
  .subtitle {
    font-style: italic;
    text-align: center;
    display: block;
    padding-bottom: 1px;
    padding-left: 4px;
    padding-right: 4px;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
  .section {
    :deep(.section-content) {
      height: calc(100% - (var(--v-vcs-font-size) * 2 + 62px)) !important;
    }
  }
</style>
