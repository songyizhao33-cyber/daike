<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  min-height: 100vh;
  background-color: #f5f7fa;
}

/* 移动端响应式优化 */
@media (max-width: 768px) {
  .el-header {
    height: auto !important;
    padding: 10px !important;
  }

  .header-content h1 {
    font-size: 18px !important;
  }

  .el-main {
    padding: 10px !important;
  }

  .el-card {
    margin-bottom: 15px;
  }

  .el-table {
    font-size: 12px;
  }

  .el-form-item__label {
    font-size: 14px;
  }

  .menu-card {
    margin-bottom: 15px;
  }

  .menu-card h3 {
    font-size: 16px !important;
  }

  .menu-card p {
    font-size: 12px !important;
  }
}
</style>
