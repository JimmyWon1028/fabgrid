<template>
  <main class="page">
    <section class="toolbar" aria-label="FabGrid controls">
      <div class="brand">
        <h1>FabGrid Vue 2</h1>
        <p>Vue 2 Options API wrapper · {{ rows.length }} × {{ columns.length }}</p>
      </div>
      <label class="field compact">
        <span>{{ text.language }}</span>
        <select v-model="locale">
          <option value="zh-TW">繁體中文</option>
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </label>
      <label class="field compact theme-field">
        <span>{{ text.theme }}</span>
        <select v-model="theme">
          <option v-for="item in themes" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="field compact narrow-number-field">
        <span>{{ text.frozen }}</span>
        <input v-model.number="frozenColumns" type="number" min="0" max="6">
      </label>
      <label class="field compact narrow-number-field">
        <span>{{ text.frozenRight }}</span>
        <input v-model.number="frozenRightColumns" type="number" min="0" max="6">
      </label>
      <label class="field compact">
        <span>{{ text.rowHeaders }}</span>
        <select v-model="showRowHeaders">
          <option :value="false">{{ text.off }}</option>
          <option :value="true">{{ text.rowNumber }}</option>
          <option value="cell">{{ text.cellOnly }}</option>
        </select>
      </label>
      <label class="field compact">
        <span>{{ text.groupRows }}</span>
        <select v-model="rowGroupMode">
          <option value="none">{{ text.groupNone }}</option>
          <option value="order">{{ text.groupOrder }}</option>
          <option value="vendor">{{ text.groupVendor }}</option>
          <option value="vendor-order">{{ text.groupVendorOrder }}</option>
        </select>
      </label>
      <label class="toggle"><input v-model="showSearchRow" type="checkbox"><span>{{ text.searchRow }}</span></label>
      <label class="toggle"><input v-model="pagination" type="checkbox"><span>{{ text.pagination }}</span></label>
      <label class="toggle"><input v-model="remote" type="checkbox"><span>{{ text.remote }}</span></label>
      <label class="toggle"><input v-model="multiSelectRows" type="checkbox"><span>{{ text.multiSelect }}</span></label>
      <label class="toggle"><input v-model="editMode" type="checkbox"><span>{{ text.editMode }}</span></label>
      <button class="toolbar-icon-button icon-export" type="button" :aria-label="text.exportCsv" :title="text.exportCsv" @click="exportCsv"></button>
      <button class="toolbar-icon-button icon-excel" type="button" :aria-label="text.exportExcel" :title="text.exportExcel" @click="exportExcel"></button>
    </section>

    <section class="stats" aria-label="FabGrid stats">
      <span>{{ text.rows }}: {{ stats.totalRows }} / {{ rows.length }}</span>
      <span>{{ text.rowsVisible }}: {{ stats.rowStart }}-{{ stats.rowEnd }}</span>
      <span>{{ text.columnsVisible }}: {{ stats.columnStart }}-{{ stats.columnEnd }} / {{ columns.length }}</span>
      <span>{{ text.renderedCells }}: {{ stats.renderedCells }}</span>
    </section>

    <section class="grid-shell">
      <fab-grid
        ref="grid"
        :items-source="rows"
        :columns="columns"
        :grid-options="gridOptions"
        :allow-editing="editMode"
        :frozen-columns="frozenColumns"
        :frozen-right-columns="frozenRightColumns"
        :locale="locale"
        :pagination="pagination"
        :remote="remote"
        :loader="remoteLoader"
        @initialized="handleInitialized"
        @load-success="updateStats"
      ></fab-grid>
      <div class="demo-filter-bar" aria-label="Demo filter">
        <span class="demo-result-count">{{ text.resultCount }}: {{ stats.totalRows }}</span>
        <label class="demo-filter-control">
          <span>{{ text.filter }}:</span>
          <span class="demo-filter-input-wrap">
            <input v-model="filterText" type="search" :placeholder="text.filterPlaceholder" autocomplete="off">
            <button class="demo-filter-mode" type="button" :aria-label="filterModeLabel" :title="filterModeLabel" @click="toggleFilterMode">{{ filterModeLabel }}</button>
            <button type="button" :aria-label="text.clearFilter" :title="text.clearFilter" @click="clearFilter">🧹</button>
          </span>
        </label>
      </div>
    </section>

    <div class="lookup-popup-overlay" :style="{ display: lookupVisible ? 'flex' : 'none' }" @mousedown.self="closeLookupPopup">
      <div class="lookup-popup-window" role="dialog" aria-modal="true" :aria-label="text.lookupTitle">
        <div class="lookup-popup-header">
          <strong class="lookup-popup-title">{{ text.lookupTitle }}</strong>
          <div class="lookup-popup-controls">
            <button class="lookup-popup-icon-button icon-close" type="button" :aria-label="text.close" :title="text.close" @click="closeLookupPopup"></button>
          </div>
        </div>
        <div class="lookup-popup-grid" @click.capture="handleLookupClick">
          <fab-grid
            ref="lookupGrid"
            :items-source="lookupRows"
            :columns="lookupColumns"
            :grid-options="lookupGridOptions"
            :locale="locale"
            @initialized="handleLookupInitialized"
          ></fab-grid>
        </div>
        <div class="lookup-popup-pager">
          <span>|‹</span><span>‹</span><strong>{{ text.lookupPage }}</strong><span>›</span><span>›|</span><span>↻</span>
          <span class="lookup-popup-count">{{ text.resultCount }}: {{ lookupRows.length }}</span>
        </div>
        <div class="lookup-popup-footer">
          <button class="lookup-popup-button icon-clear" type="button" @click="clearLookupSelection">{{ text.clearFilter }}</button>
          <button class="lookup-popup-button icon-remove" type="button" @click="closeLookupPopup">{{ text.cancel }}</button>
          <button class="lookup-popup-button icon-check" type="button" @click="applyLookupValue">{{ text.confirm }}</button>
        </div>
      </div>
    </div>
  </main>
</template>

<script>
import Vue from 'vue';
import fabui from '../src/fabui.js';
import { createFabGridVue } from '../packages/fabgrid-vue/src/fabgrid-vue.js';
import './demo-data.js';
import './vue2-grid.js';

const wrapper = createFabGridVue(Vue, fabui);
const options = window.createVue2GridDemoOptions();

options.name = 'FabGridVue2Demo';
options.components = {
  FabGrid: wrapper.FabGrid
};

export default options;
</script>

<style>
@import '../src/fabui.css';
@import './my.icon.css';
@import './style.css';
</style>
