import { computed, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';

import { preferences } from '@vben/preferences';

function useContentSpinner() {
  const spinning = ref(false);
  const startTime = ref(0);
  const router = useRouter();
  const minShowTime = 500; // 最小显示时间
  const enableLoading = computed(() => preferences.transition.loading);
  let endTimer: ReturnType<typeof setTimeout> | undefined;

  const clearEndTimer = () => {
    if (endTimer) clearTimeout(endTimer);
    endTimer = undefined;
  };

  // 结束加载动画
  const onEnd = () => {
    if (!enableLoading.value) {
      return;
    }
    const processTime = performance.now() - startTime.value;
    if (processTime < minShowTime) {
      clearEndTimer();
      endTimer = setTimeout(() => {
        endTimer = undefined;
        spinning.value = false;
      }, minShowTime - processTime);
    } else {
      clearEndTimer();
      spinning.value = false;
    }
  };

  // 路由前置守卫
  const removeBeforeEach = router.beforeEach((to) => {
    if (to.meta.loaded || !enableLoading.value || to.meta.iframeSrc) {
      return true;
    }
    clearEndTimer();
    startTime.value = performance.now();
    spinning.value = true;
    return true;
  });

  // 路由后置守卫
  const removeAfterEach = router.afterEach((to) => {
    if (to.meta.loaded || !enableLoading.value || to.meta.iframeSrc) {
      return true;
    }
    onEnd();
    return true;
  });

  onBeforeUnmount(() => {
    clearEndTimer();
    removeBeforeEach();
    removeAfterEach();
  });

  return { spinning };
}

export { useContentSpinner };
