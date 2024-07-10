import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import compress from 'vite-plugin-compression';
import Components from 'unplugin-vue-components/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    compress({
      verbose: true, // 是否在控制台输出压缩结果
      disable: false, // 是否禁用压缩
      algorithm: 'gzip', // 压缩算法
      threshold: 10240, // 压缩阈值，小于该大小的文件将不会被压缩
      deleteOriginFile: false, // 是否删除原文件
      
    }),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false, // css in js
        }),
      ],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    proxy: {
      '/chat': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/chat/, '')
      }
    }
  }
})
