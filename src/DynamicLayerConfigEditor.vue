<template>
  <AbstractConfigEditor
    v-if="localConfig"
    v-bind="{ ...$attrs, ...$props }"
    @submit="apply"
  >
    <v-container class="pa-0">
      <VcsFormSection
        :heading="$t('dynamicLayer.config.general')"
        expandable
        start-open
        :disabled="!localConfig.enabledTabs.includes(CategoryType.WEBDATA)"
      >
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="enabledTabs">
              {{ $t('dynamicLayer.config.enabledTabs') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="enabledTabs"
              v-model="localConfig.enabledTabs"
              multiple
              :items="tabs"
              :rules="[(s: string[]) => !!s.length]"
              @update:model-value="checkDefaultTab"
            />
          </v-col>
        </v-row>
        <v-row no-gutters>
          <v-col>
            <VcsLabel html-for="defaultTab">
              {{ $t('dynamicLayer.config.defaultTab') }}
            </VcsLabel>
          </v-col>
          <v-col>
            <VcsSelect
              id="defaultTab"
              v-model="localConfig.defaultTab"
              :items="localConfig.enabledTabs"
              :actions="titleAction"
              :item-text="(s: string) => $t(`dynamicLayer.${s}.title`)"
            />
          </v-col>
        </v-row>
      </VcsFormSection>

      <VcsFormSection
        :heading="$t('dynamicLayer.webdata.title')"
        :expandable="localConfig.enabledTabs.includes(CategoryType.WEBDATA)"
        start-open
        :disabled="!localConfig.enabledTabs.includes(CategoryType.WEBDATA)"
      >
        <span v-if="localConfig.enabledTabs.includes(CategoryType.WEBDATA)">
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="webdataType">
                {{ $t('dynamicLayer.config.defaultType') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsSelect
                id="webdataType"
                v-model="localConfig.webdata.defaultType"
                :items="webdataTypes"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="webdataUrl">
                {{ $t('dynamicLayer.config.defaultUrl') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="webdataUrl"
                v-model="localConfig.webdata.defaultUrl"
              />
            </v-col>
          </v-row>
        </span>
      </VcsFormSection>

      <VcsFormSection
        :heading="$t('dynamicLayer.catalogues.title')"
        :expandable="localConfig.enabledTabs.includes(CategoryType.CATALOGUES)"
        start-open
        :disabled="!localConfig.enabledTabs.includes(CategoryType.CATALOGUES)"
      >
        <span v-if="localConfig.enabledTabs.includes(CategoryType.CATALOGUES)">
          <v-row no-gutters>
            <v-col>
              <VcsLabel html-for="cataloguesItemsPerPage">
                {{ $t('dynamicLayer.config.itemsPerPage') }}
              </VcsLabel>
            </v-col>
            <v-col>
              <VcsTextField
                id="cataloguesItemsPerPage"
                v-model.number="localConfig.catalogues.itemsPerPage"
                type="number"
              />
            </v-col>
          </v-row>
          <v-row no-gutters>
            <VcsList
              :items="catalogues"
              :title="'dynamicLayer.config.presets'"
              :actions="titleAction"
            />
          </v-row>
          <v-dialog
            :model-value="!!dialog"
            width="500"
            @update:model-value="dialog = $event"
          >
            <v-card class="pa-2">
              <v-form @submit.prevent="addOrUpdate">
                <v-row no-gutters>
                  <v-col>
                    <VcsLabel required html-for="title">
                      {{ $t('dynamicLayer.common.title') }}
                    </VcsLabel>
                  </v-col>
                  <v-col>
                    <VcsTextField
                      id="title"
                      v-model="menuCatalogueItem.title"
                    />
                  </v-col>
                </v-row>
                <v-row no-gutters>
                  <v-col>
                    <VcsLabel required html-for="url">URL</VcsLabel>
                  </v-col>
                  <v-col>
                    <VcsTextField
                      id="url"
                      v-model="menuCatalogueItem.url"
                      :rules="[() => isUrl(menuCatalogueItem.url)]"
                    />
                  </v-col>
                </v-row>
                <v-row no-gutters>
                  <v-col>
                    <VcsLabel required html-for="type">
                      {{ $t('dynamicLayer.common.type') }}
                    </VcsLabel>
                  </v-col>
                  <v-col>
                    <VcsSelect
                      id="type"
                      v-model="menuCatalogueItem.type"
                      :items="cataloguesTypes"
                    />
                  </v-col>
                </v-row>
                <v-row no-gutters>
                  <v-col>
                    <VcsLabel html-for="subtitle">
                      {{ $t('dynamicLayer.config.subtitle') }}
                    </VcsLabel>
                  </v-col>
                  <v-col>
                    <VcsTextField
                      id="subtitle"
                      v-model="menuCatalogueItem.subtitle"
                    />
                  </v-col>
                </v-row>
                <v-row no-gutters>
                  <v-col>
                    <VcsLabel html-for="logo">
                      {{ $t('dynamicLayer.config.logo') }}
                    </VcsLabel>
                  </v-col>
                  <v-col>
                    <VcsTextField id="logo" v-model="menuCatalogueItem.logo" />
                  </v-col>
                </v-row>
                <v-row no-gutters>
                  <VcsTextArea
                    v-model="menuCatalogueItem.description"
                    :placeholder="`${$t('dynamicLayer.common.description')} (markdown)`"
                  />
                </v-row>
                <span class="d-flex justify-end gc-2 pt-1">
                  <VcsFormButton
                    variant="filled"
                    type="submit"
                    :disabled="
                      !menuCatalogueItem.title || !menuCatalogueItem.url
                    "
                  >
                    {{ $t('dynamicLayer.actions.apply') }}
                  </VcsFormButton>
                  <VcsFormButton @click="dialog = false">
                    {{ $t('dynamicLayer.actions.cancel') }}
                  </VcsFormButton>
                </span>
              </v-form>
            </v-card>
          </v-dialog>
        </span>
      </VcsFormSection>
    </v-container>
  </AbstractConfigEditor>
</template>

<script lang="ts">
  import {
    VContainer,
    VRow,
    VCol,
    VDialog,
    VCard,
    VForm,
  } from 'vuetify/components';
  import type { VcsAction } from '@vcmap/ui';
  import {
    AbstractConfigEditor,
    VcsLabel,
    VcsTextField,
    VcsSelect,
    VcsFormSection,
    VcsList,
    VcsFormButton,
    VcsTextArea,
  } from '@vcmap/ui';
  import type { PropType, Ref } from 'vue';
  import { defineComponent, reactive, ref, toRaw } from 'vue';
  import type {
    CataloguePreset,
    DynamicLayerConfig,
  } from './defaultOptions.js';
  import { getDefaultOptions } from './defaultOptions.js';
  import { CategoryType } from './constants.js';
  import { getAvailableTypes } from './helper.js';
  import { CataloguesTypes } from './catalogues/catalogues.js';

  export default defineComponent({
    name: 'DynamicLayerConfigEditor',
    components: {
      VCard,
      VCol,
      VContainer,
      VDialog,
      VForm,
      VRow,
      AbstractConfigEditor,
      VcsFormButton,
      VcsFormSection,
      VcsLabel,
      VcsList,
      VcsSelect,
      VcsTextArea,
      VcsTextField,
    },
    props: {
      getConfig: {
        type: Function as PropType<() => DynamicLayerConfig>,
        required: true,
      },
      setConfig: {
        type: Function as PropType<(config: object | undefined) => void>,
        required: true,
      },
    },
    setup(props) {
      const defaultOptions = getDefaultOptions();
      const config = props.getConfig();
      const localConfig = ref({ ...defaultOptions, ...config });
      const tabs = ref(
        Object.values(CategoryType)
          .filter((t) => t !== CategoryType.ADDED)
          .map((t) => ({
            title: `dynamicLayer.${t}.title`,
            value: t,
          })),
      );
      const webdataTypes = ref(getAvailableTypes(CategoryType.WEBDATA));
      const cataloguesTypes = ref(getAvailableTypes(CategoryType.CATALOGUES));
      const catalogues: Ref<Array<{ title: string; actions?: VcsAction[] }>> =
        ref([]);
      const menuCatalogueItem = ref<CataloguePreset>({
        url: '',
        type: CataloguesTypes.PIVEAU,
        title: '',
        subtitle: '',
        logo: '',
        description: '',
      });
      const dialog = ref(false);
      function updateList(): void {
        catalogues.value = [];
        localConfig.value.catalogues.presets.forEach((c) => {
          catalogues.value.push({
            title: c.title ?? c.url,
            actions: [
              reactive({
                name: 'dynamicLayer.actions.edit',
                icon: 'mdi-pencil',
                callback: (): void => {
                  dialog.value = true;
                  menuCatalogueItem.value = c;
                },
              }),
              reactive({
                name: 'dynamicLayer.actions.remove',
                icon: 'mdi-delete',
                callback: (): void => {
                  const index = localConfig.value.catalogues.presets.findIndex(
                    (p) => p.url === c.url,
                  );
                  localConfig.value.catalogues.presets.splice(index, 1);
                  const indexCat = catalogues.value.findIndex(
                    (p) => p.title === (c.title ?? c.url),
                  );
                  catalogues.value.splice(indexCat, 1);
                },
              }),
            ],
          });
        });
      }
      updateList();

      return {
        CategoryType,
        localConfig,
        tabs,
        webdataTypes,
        cataloguesTypes,
        catalogues,
        menuCatalogueItem,
        dialog,
        titleAction: ref([
          {
            name: 'dynamicLayer.config.addPreset',
            icon: '$vcsPlus',
            callback(): void {
              dialog.value = true;
              menuCatalogueItem.value = {
                url: '',
                type: CataloguesTypes.PIVEAU,
                title: '',
                subtitle: '',
                logo: '',
                description: '',
              };
            },
          },
        ]),
        isUrl(value: string): boolean | string {
          try {
            return Boolean(new URL(value));
          } catch (e) {
            return 'dynamicLayer.errors.invalidUrl';
          }
        },
        checkDefaultTab(): void {
          if (
            !localConfig.value.enabledTabs.includes(
              localConfig.value.defaultTab,
            )
          ) {
            localConfig.value.defaultTab = localConfig.value.enabledTabs[0];
          }
        },
        addOrUpdate(): void {
          const idx = localConfig.value.catalogues.presets.findIndex(
            (c) => c.url === menuCatalogueItem.value.url,
          );
          if (idx !== -1) {
            localConfig.value.catalogues.presets[idx] = toRaw(
              menuCatalogueItem.value,
            );
          } else {
            localConfig.value.catalogues.presets.push(
              toRaw(menuCatalogueItem.value),
            );
          }
          dialog.value = false;
          updateList();
        },
        apply(): void {
          const rawConfig: DynamicLayerConfig = structuredClone(
            toRaw(localConfig.value),
          );
          rawConfig.enabledTabs.map(toRaw);
          rawConfig.webdata = structuredClone(toRaw(rawConfig.webdata));
          rawConfig.catalogues = {
            itemsPerPage: toRaw(rawConfig.catalogues.itemsPerPage),
            presets: rawConfig.catalogues.presets.map((p) =>
              structuredClone(toRaw(p)),
            ),
          };
          props.setConfig(rawConfig);
        },
      };
    },
  });
</script>

<style scoped>
  :deep(.vcsList) {
    width: 100% !important;
  }
</style>
