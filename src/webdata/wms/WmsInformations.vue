<template>
  <WebdataInformations
    :item="item"
    :subtitle="item.name"
    @switchTo="(c) => $emit('switchTo', c)"
  >
    <template #informations>
      <v-row no-gutters class="w-full" v-if="item?.keywordList?.length">
        <v-chip
          v-for="keyword in item.keywordList"
          label
          x-small
          color="primary"
          class="ma-1"
          :key="keyword"
          >{{ keyword }}</v-chip
        >
      </v-row>

      <span no-gutters v-if="item?.description" class="w-full">
        <v-row no-gutters>
          <VcsLabel class="font-weight-bold">{{
            $t('dynamicLayer.info.description')
          }}</VcsLabel>
        </v-row>
        <v-row no-gutters class="px-2">
          {{ item.description }}
        </v-row>
      </span>

      <span v-if="item?.accessConstraints" class="w-full">
        <v-row no-gutters>
          <VcsLabel class="font-weight-bold">{{
            $t('dynamicLayer.info.accessConstraints')
          }}</VcsLabel>
        </v-row>
        <v-row no-gutters class="px-2">
          {{ item.accessConstraints }}
        </v-row>
      </span>

      <span v-if="item?.fees" class="w-full">
        <v-row no-gutters>
          <VcsLabel class="font-weight-bold">{{
            $t('dynamicLayer.info.fees')
          }}</VcsLabel>
        </v-row>
        <v-row no-gutters class="px-2">
          {{ item.fees }}
        </v-row>
      </span>

      <span v-if="item?.extent" class="w-full">
        <v-row no-gutters>
          <VcsLabel class="font-weight-bold">{{
            $t('dynamicLayer.info.extent')
          }}</VcsLabel>
        </v-row>
        <v-row no-gutters>
          <VcsExtent :value="item.extent.toJSON()" disabled />
        </v-row>
      </span>

      <span v-if="checkAnyProperty(item?.attribution)" class="w-full">
        <v-row no-gutters>
          <VcsLabel class="font-weight-bold">{{
            $t('dynamicLayer.info.attributions')
          }}</VcsLabel>
        </v-row>
        <v-row no-gutters class="px-2">
          <div>
            {{ item?.attribution?.title }}
            <br />
            <a
              v-if="item?.attribution?.onlineResource"
              :href="item.attribution.onlineResource"
              target="_blank"
              >{{ $t('dynamicLayer.info.website') }}
            </a>
          </div>
        </v-row>
      </span>

      <span v-if="checkAnyProperty(item?.contact)" class="w-full">
        <v-row no-gutters>
          <VcsLabel class="font-weight-bold">{{
            $t('dynamicLayer.info.contact')
          }}</VcsLabel>
        </v-row>
        <v-row no-gutters class="px-2">
          <p>
            {{ item.contact?.person
            }}{{
              item.contact?.person && item.contact?.organization ? ' - ' : ''
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
  </WebdataInformations>
</template>

<script lang="ts">
  import { PropType, defineComponent } from 'vue';
  import { VcsExtent, VcsLabel } from '@vcmap/ui';
  import { VChip, VRow } from 'vuetify/lib';
  import { CategoryType } from '../../constants.js';
  import { DataItem, WebdataTypes } from '../webdataConstants.js';
  import WebdataInformations from '../WebdataInformations.vue';

  export default defineComponent({
    name: 'WmsInformations',
    components: {
      VChip,
      VRow,
      VcsExtent,
      VcsLabel,
      WebdataInformations,
    },
    props: {
      item: {
        type: Object as PropType<DataItem<WebdataTypes.WMS>>,
        required: true,
      },
    },
    setup() {
      return {
        CategoryType,
        checkAnyProperty(obj: object | undefined): boolean {
          if (!obj) return false;
          return Object.values(obj).some((v) => !!v);
        },
      };
    },
  });
</script>
<style lang="scss" scoped></style>
