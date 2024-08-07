<template>
  <span>
    <v-row no-gutters style="height: 492px">
      <v-card flat class="w-full">
        <v-card-title
          class="d-flex font-weight-bold justify-center text-decoration-underline pa-0"
        >
          {{ item?.title ?? $t(`dynamicLayer.webdata.${item.type}`) }}
        </v-card-title>
        <v-card-subtitle class="py-2 d-flex justify-center font-italic">
          <span class="text-truncate">{{ subtitle }}</span>
        </v-card-subtitle>
        <v-card flat class="w-full" :rounded="null">
          <v-card-title class="base lighten-3 pa-1">
            <v-icon color="primary" class="px-2">$vcsInfo</v-icon
            >{{ $t('dynamicLayer.info.title') }}<v-spacer />
          </v-card-title>
          <span
            :style="{
              display: 'inline-block',
              'max-height': '415px',
              'overflow-y': 'auto',
            }"
          >
            <slot name="informations"></slot>
          </span>
        </v-card>
      </v-card>
    </v-row>
    <ActionsButtons
      :item="item"
      :selected-tab="CategoryType.WEBDATA"
      @switchTo="(c) => $emit('switchTo', c)"
    />
  </span>
</template>

<script lang="ts">
  import { PropType, defineComponent } from 'vue';
  import {
    VCard,
    VCardSubtitle,
    VCardTitle,
    VIcon,
    VRow,
    VSpacer,
  } from 'vuetify/lib';
  import { CategoryType } from '../constants.js';
  import { DataItem } from './webdataConstants.js';
  import ActionsButtons from './ActionsButtons.vue';

  export default defineComponent({
    name: 'WebdataInformations',
    components: {
      VCard,
      VCardTitle,
      VCardSubtitle,
      VIcon,
      VRow,
      VSpacer,
      ActionsButtons,
    },
    props: {
      item: { type: Object as PropType<DataItem>, required: true },
      subtitle: { type: String, required: true },
    },
    setup() {
      return { CategoryType };
    },
  });
</script>
<style lang="scss" scoped>
  :deep(.v-card__title) {
    border-radius: 4px;
  }
</style>
