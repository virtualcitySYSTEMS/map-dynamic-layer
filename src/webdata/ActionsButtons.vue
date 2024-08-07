<template>
  <v-row no-gutters class="pt-1">
    <v-col cols="3">
      <VcsFormButton
        v-if="
          availableActions.includes(ActionsNames.DeleteSource) &&
          selectedTab !== CategoryType.ADDED
        "
        @click="handleClick(ActionsNames.DeleteSource)"
        >{{ $t('dynamicLayer.actions.deleteSource') }}
      </VcsFormButton>
    </v-col>
    <v-col cols="9" class="d-flex justify-end">
      <VcsFormButton
        v-if="availableActions.includes(ActionsNames.AddAll)"
        variant="filled"
        :disabled="!getNonAddedChildrenLength(item)"
        @click="handleClick(ActionsNames.AddAll)"
        >{{ $t('dynamicLayer.actions.addAll') }} ({{
          getNonAddedChildrenLength(item)
        }})
      </VcsFormButton>
      <span v-if="item?.isAddedToMap">
        <VcsFormButton
          v-if="selectedTab !== CategoryType.ADDED"
          @click="$emit('switchTo', CategoryType.ADDED)"
          class="pr-2"
          >{{ $t('dynamicLayer.actions.edit') }}
        </VcsFormButton>
        <VcsFormButton
          v-else
          @click="$emit('switchTo', findType())"
          class="pr-2"
          >{{ $t('dynamicLayer.actions.description') }}
        </VcsFormButton>
        <VcsFormButton
          variant="filled"
          @click="
            () => {
              handleClick(ActionsNames.RemoveLayer);
              $emit('reloadAddedContent');
            }
          "
          >{{ $t('dynamicLayer.actions.removeLayer') }}
        </VcsFormButton>
      </span>
      <VcsFormButton
        v-if="availableActions.includes(ActionsNames.AddToMap)"
        variant="filled"
        @click="handleClick(ActionsNames.AddToMap)"
        >{{ $t('dynamicLayer.actions.addToMap') }}
      </VcsFormButton>
    </v-col>
  </v-row>
</template>

<script lang="ts">
  import { computed, defineComponent, PropType } from 'vue';
  import { VcsFormButton } from '@vcmap/ui';
  import { VCol, VRow } from 'vuetify/lib';
  import { DataItem, WebdataTypes } from './webdataConstants.js';
  import {
    ActionsNames,
    getNonAddedChildrenLength,
  } from './webdataActionsHelper.js';
  import { CategoryType } from '../constants.js';

  export default defineComponent({
    name: 'ActionsButtons',
    components: { VCol, VRow, VcsFormButton },
    props: {
      item: { type: Object as PropType<DataItem>, required: true },
      selectedTab: { type: String as PropType<CategoryType>, required: true },
    },
    setup(props) {
      const availableActions = computed(() => {
        return props.item.actions.map((a) => a.name);
      });
      return {
        ActionsNames,
        CategoryType,
        getNonAddedChildrenLength,
        availableActions,

        async handleClick(actionName: string): Promise<void> {
          await props.item.actions
            .find((a) => a.name === actionName)!
            .callback(this);
        },
        findType(): CategoryType {
          if (Object.values(WebdataTypes).includes(props.item.type)) {
            return CategoryType.WEBDATA;
          }
          return CategoryType.CATALOGUE;
        },
      };
    },
  });
</script>

<style lang="scss" scoped></style>
