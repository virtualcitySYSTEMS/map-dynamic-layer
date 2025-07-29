<template>
  <v-row no-gutters class="w-100">
    <v-col :cols="selection.length ? 11 : 12">
      <VcsSelect
        item-value="id"
        :items="filteredItems"
        :label="facet.title"
        :model-value="selection"
        :menu-props="{ origin: 'overlap', modelValue: opened }"
        :disabled="!!selection.length"
        @click="$emit('toggleFacet', facet.id)"
        @update:model-value="apply"
      >
        <template v-if="facet.values.length > 1" #prepend-item>
          <v-row no-gutters class="px-2 pt-1">
            <VcsTextField
              v-model="search"
              autofocus
              :placeholder="`${$t('dynamicLayer.common.filter')} ${facet.title}`"
              clearable
            />
            <VcsButton
              class="pl-2 pt-2"
              :icon="'mdi-window-close'"
              :tooltip="$t('dynamicLayer.actions.cancel')"
              @click="$emit('toggleFacet', '')"
            />
          </v-row>
        </template>
      </VcsSelect>
    </v-col>
    <v-col v-if="selection.length" cols="1" class="d-flex align-center px-1">
      <VcsButton
        :icon="'mdi-filter-remove'"
        :tooltip="$t('dynamicLayer.actions.filter.reset')"
        @click="reset"
      />
    </v-col>
  </v-row>
</template>

<script lang="ts">
  import { VCol, VRow } from 'vuetify/components';
  import type { PropType } from 'vue';
  import { computed, defineComponent, ref } from 'vue';
  import { VcsButton, VcsSelect, VcsTextField } from '@vcmap/ui';
  import type { Facet } from './catalogues.js';

  export default defineComponent({
    name: 'CataloguesFilter',
    components: {
      VCol,
      VRow,
      VcsButton,
      VcsTextField,
      VcsSelect,
    },
    props: {
      facet: {
        type: Object as PropType<Facet>,
        required: true,
      },
      selection: { type: Array<string>, required: true },
      opened: { type: Boolean, required: true },
    },
    emits: ['filter', 'toggleFacet'],
    setup(props, { emit }) {
      const search = ref('');

      const filteredItems = computed(() =>
        search.value
          ? props.facet.values.filter((i) =>
              i.title.toLowerCase().includes(search.value.toLowerCase()),
            )
          : props.facet.values,
      );
      return {
        filteredItems,
        search,
        apply(s: string): void {
          emit('filter', props.facet.id, [s]);
          emit('toggleFacet', '');
        },
        reset(): void {
          emit('filter', props.facet.id, []);
        },
      };
    },
  });
</script>

<style lang="scss" scoped></style>
