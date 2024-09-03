<template>
  <span class="d-flex flex-column w-100 h-100">
    <v-row no-gutters class="h-100 overflow-y-auto">
      <v-card flat class="w-100 pb-1 overflow-y-auto">
        <span>
          <v-card-title
            class="d-flex font-weight-bold justify-center text-decoration-underline pa-0"
          >
            {{ item?.title ?? $t(`dynamicLayer.webdata.${item.type}`) }}
          </v-card-title>
          <v-card-subtitle class="d-flex justify-center font-italic">
            <span class="text-truncate">{{ subtitle }}</span>
          </v-card-subtitle>
        </span>
        <v-card flat class="w-100" :rounded="false">
          <v-card-title class="bg-base-lighten-3 rounded pa-2">
            <span class="d-flex align-center gc-1">
              <v-icon color="primary" icon="$vcsInfo" />
              {{ $t('dynamicLayer.info.title') }}
            </span>
          </v-card-title>
          <span class="d-block">
            <slot name="informations"></slot>
          </span>
        </v-card>
      </v-card>
    </v-row>
    <ActionsButtons
      class="w-100"
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
  } from 'vuetify/components';
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
<style lang="scss" scoped></style>
