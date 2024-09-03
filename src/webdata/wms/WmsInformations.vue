<template>
  <WebdataInformations
    :item="item"
    :subtitle="item.name"
    @switchTo="(c) => $emit('switchTo', c)"
  >
    <template #informations>
      <v-row no-gutters class="w-100" v-if="item.keywordList?.length">
        <v-chip
          v-for="keyword in item.keywordList"
          label
          size="x-small"
          color="primary"
          class="ma-1"
          :key="keyword"
          >{{ keyword }}</v-chip
        >
      </v-row>

      <span no-gutters v-if="item.description" class="w-100">
        <v-row no-gutters>
          <VcsLabel html-for="description" class="font-weight-bold">{{
            $t('dynamicLayer.info.description')
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

      <span v-if="checkAnyProperty(item.attribution)" class="w-100">
        <v-row no-gutters>
          <VcsLabel html-for="attributions" class="font-weight-bold">{{
            $t('dynamicLayer.info.attributions')
          }}</VcsLabel>
        </v-row>
        <v-row no-gutters class="px-2">
          <div>
            {{ item.attribution?.title }}
            <br />
            <a
              v-if="item.attribution?.onlineResource"
              :href="item.attribution.onlineResource"
              target="_blank"
              >{{ $t('dynamicLayer.info.website') }}
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
  import { VChip, VRow } from 'vuetify/components';
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
