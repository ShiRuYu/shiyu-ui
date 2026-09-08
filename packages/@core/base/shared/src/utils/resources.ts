/**
 * 加载js文件
 * @param src js文件地址
 */
const pendingScripts = new Map<string, Promise<void>>();

function loadScript(src: string) {
  const pending = pendingScripts.get(src);
  if (pending) return pending;

  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) {
    // 已由其他代码插入的脚本视为已加载；本模块只协调自己发起的并发加载。
    return Promise.resolve();
  }

  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error(`Failed to load script: ${src}`)),
      { once: true },
    );
    document.head.append(script);
  }).finally(() => {
    pendingScripts.delete(src);
  });

  pendingScripts.set(src, promise);
  return promise;
}

export { loadScript };
