<template>
  <div class="tarot-container">
    <el-card class="tarot-card">
      <template #header>
        <div class="card-header">
          <span>塔罗牌占卜</span>
          <el-button @click="$router.push('/home')" size="small">返回首页</el-button>
        </div>
      </template>

      <div v-if="!drawnCard" class="draw-section">
        <div class="intro">
          <p>静下心来，想一个问题</p>
          <p>然后点击下方按钮抽取一张塔罗牌</p>
        </div>
        <el-button
          type="primary"
          size="large"
          :loading="loading"
          @click="drawCard"
          class="draw-button"
        >
          {{ loading ? '抽取中...' : '抽取塔罗牌' }}
        </el-button>
      </div>

      <div v-else class="result-section">
        <div class="card-display">
          <div
            class="tarot-image-wrapper"
            :class="{ reversed: drawnCard.isReversed }"
          >
            <img
              :src="`/tarot-images/${drawnCard.imageFile}`"
              :alt="drawnCard.name"
              class="tarot-image"
            />
          </div>
          <div class="card-name">
            {{ drawnCard.name }}
            <span class="position">
              （{{ drawnCard.isReversed ? '逆位' : '正位' }}）
            </span>
          </div>
        </div>

        <div class="meaning-section">
          <el-alert
            v-if="drawnCard.specialMessage"
            :title="drawnCard.specialMessage"
            type="success"
            :closable="false"
            class="special-message"
          />

          <div class="meaning-content">
            <h3>牌意解释</h3>
            <p>{{ drawnCard.meaning }}</p>
          </div>
        </div>

        <el-button
          type="primary"
          @click="resetDraw"
          class="reset-button"
        >
          再抽一张
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { ElMessage } from 'element-plus';
import request from '../utils/request';

const loading = ref(false);
const drawnCard = ref(null);

const preloadImage = (src) => new Promise((resolve) => {
  const img = new Image();
  img.onload = () => resolve(true);
  img.onerror = () => resolve(false);
  img.src = src;
});

onMounted(async () => {
  try {
    const cards = await request.get('/tarot/all');
    if (Array.isArray(cards)) {
      cards.forEach((card) => {
        if (card?.imageFile) {
          preloadImage(`/tarot-images/${card.imageFile}`);
        }
      });
    }
  } catch (error) {
    // Ignore preload failures and keep draw flow available.
  }
});

const drawCard = async () => {
  loading.value = true;
  try {
    let data;
    try {
      data = await request.post('/tarot/draw');
    } catch (error) {
      // Auto initialize tarot data on first run, then retry once.
      if (error.response?.status === 404) {
        await request.post('/tarot/initialize');
        data = await request.post('/tarot/draw');
      } else {
        throw error;
      }
    }
    // request 已经返回 response.data，所以直接使用 data.tarot
    if (data?.tarot?.imageFile) {
      preloadImage(`/tarot-images/${data.tarot.imageFile}`);
    }
    drawnCard.value = data.tarot;
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '抽取失败');
  } finally {
    loading.value = false;
  }
};

const resetDraw = () => {
  drawnCard.value = null;
};
</script>

<style scoped>
.tarot-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.tarot-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
  font-weight: bold;
}

.draw-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

.intro {
  text-align: center;
  margin-bottom: 40px;
  font-size: 16px;
  color: #666;
  line-height: 2;
}

.draw-button {
  font-size: 18px;
  padding: 15px 40px;
}

.result-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-display {
  text-align: center;
  margin-bottom: 30px;
}

.tarot-image-wrapper {
  width: 300px;
  height: 500px;
  margin: 0 auto 20px;
  transition: transform 0.6s;
}

.tarot-image-wrapper.reversed {
  transform: rotate(180deg);
}

.tarot-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.position {
  font-size: 18px;
  color: #666;
  margin-left: 10px;
}

.meaning-section {
  width: 100%;
  max-width: 600px;
}

.special-message {
  margin-bottom: 20px;
  font-size: 16px;
}

.meaning-content {
  background: #f5f7fa;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
}

.meaning-content h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.meaning-content p {
  line-height: 1.8;
  color: #666;
  font-size: 15px;
}

.reset-button {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .tarot-image-wrapper {
    width: 200px;
    height: 333px;
  }

  .card-name {
    font-size: 20px;
  }

  .position {
    font-size: 16px;
  }
}
</style>

