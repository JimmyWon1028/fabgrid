<template>
  <div class="vue-card">
    <p>{{ message }}</p>
    <button type="button" @click="count += 1">
      點擊次數：{{ count }}
    </button>
  </div>
</template>

<script>
new Vue({
  el: '#vue-demo',
  data: function() {
    return {
      message: 'hello.vue 已由 fabLoader.vue() 載入',
      count: 0
    };
  }
});
</script>

<style>
.vue-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.vue-card p {
  margin: 0;
  color: #312e81;
  font-weight: 700;
}
</style>
