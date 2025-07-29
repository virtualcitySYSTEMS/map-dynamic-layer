<template>
  <v-row v-if="item.keywordList?.length" no-gutters class="w-100">
    <v-chip
      v-for="keyword in item.keywordList"
      :key="keyword"
      label
      size="x-small"
      color="primary"
      class="ma-1"
      >{{ keyword }}</v-chip
    >
  </v-row>

  <span v-if="item.description" class="w-100">
    <v-row no-gutters>
      <VcsLabel html-for="description" class="font-weight-bold">{{
        $t('dynamicLayer.common.description')
      }}</VcsLabel>
    </v-row>
    <v-row no-gutters class="px-2">
      {{ item.description }}
    </v-row>
  </span>

  <span v-if="item.accessConstraints" class="w-100">
    <v-row no-gutters>
      <VcsLabel html-for="accessConstraints" class="font-weight-bold">{{
        $t('dynamicLayer.info.accessConstraints')
      }}</VcsLabel>
    </v-row>
    <v-row no-gutters class="px-2">
      {{ item.accessConstraints }}
    </v-row>
  </span>

  <span v-if="item.fees" class="w-100">
    <v-row no-gutters>
      <VcsLabel html-for="fees" class="font-weight-bold">{{
        $t('dynamicLayer.info.fees')
      }}</VcsLabel>
    </v-row>
    <v-row no-gutters class="px-2">
      {{ item.fees }}
    </v-row>
  </span>

  <span v-if="item.extent" class="w-100">
    <v-row no-gutters>
      <VcsLabel html-for="extent" class="font-weight-bold">{{
        $t('dynamicLayer.info.extent')
      }}</VcsLabel>
    </v-row>
    <v-row no-gutters>
      <VcsExtent disabled :model-value="item.extent.toJSON()" />
    </v-row>
  </span>

  <span v-if="checkAnyProperty(item.attributions)" class="w-100">
    <v-row no-gutters>
      <VcsLabel html-for="attributions" class="font-weight-bold">{{
        $t('dynamicLayer.info.attributions')
      }}</VcsLabel>
    </v-row>
    <v-row no-gutters class="px-2">
      <div>
        {{ item.attributions?.provider }}
        <br />
        <a
          v-if="item.attributions?.url"
          :href="item.attributions.url"
          target="_blank"
        >
          {{ $t('dynamicLayer.info.website') }}
        </a>
      </div>
    </v-row>
  </span>

  <span v-if="checkAnyProperty(item.contact)" class="w-100">
    <v-row no-gutters>
      <VcsLabel html-for="contact" class="font-weight-bold">{{
        $t('dynamicLayer.info.contact')
      }}</VcsLabel>
    </v-row>
    <v-row no-gutters class="px-2 pb-1">
      <p>
        {{ item.contact?.person
        }}{{ item.contact?.person && item.contact?.organization ? ' - ' : ''
        }}{{ item.contact?.organization }}
        <br v-if="item.contact?.organization" />
        {{ item.contact?.position }}
        <br v-if="item.contact?.position" />
        {{ item.contact?.address }}
        <br v-if="item.contact?.address" />
        {{ item.contact?.city
        }}{{ item.contact?.city && item.contact?.country ? ', ' : ''
        }}{{ item.contact?.country }}
      </p>
    </v-row>
  </span>
</template>

<script lang="ts">
  import type { PropType } from 'vue';
  import { defineComponent } from 'vue';
  import { VcsExtent, VcsLabel } from '@vcmap/ui';
  import { VChip, VRow } from 'vuetify/components';
  import { CategoryType } from '../constants.js';
  import type { DataItem, WxsWebdataTypes } from './webdataConstants.js';

  /** A component used to render WFS, WMS and WMTS informations. */

  export default defineComponent({
    name: 'WxsInformations',
    components: {
      VChip,
      VRow,
      VcsExtent,
      VcsLabel,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WxsWebdataTypes>>,
        required: true,
      },
    },
    setup() {
      return {
        CategoryType,
        checkAnyProperty(obj: object | undefined): boolean {
          if (!obj) {
            return false;
          }
          return Object.values(obj).some((v) => !!v);
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
