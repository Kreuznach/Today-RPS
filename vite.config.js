import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // .ait 번들은 내부 경로가 상대 경로여야 합니다
  base: './',
  build: {
    outDir: 'dist',
    // 단일 JS/CSS 번들로 최소화 (WebView 환경 최적화)
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // 인라인 임계값: 4KB 이하 에셋은 base64 인라인
    assetsInlineLimit: 4096,
  },
});
