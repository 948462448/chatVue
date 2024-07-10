import { defineConfig } from 'rollup';
import vue from '@vitejs/plugin-vue';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import { visualizer } from 'rollup-plugin-visualizer';
import css from 'rollup-plugin-css-only'; // 新增
import postcss from 'rollup-plugin-postcss'; // 新增
import url from 'rollup-plugin-url'; // 新增

export default defineConfig({
  input: 'src/main.ts', // 你的入口文件
  output: [
    {
      file: 'dist/bundle.cjs.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/bundle.esm.js',
      format: 'esm',
      sourcemap: true
    },
  ],
  plugins: [
    vue(), // 处理 Vue 3 的单文件组件
    resolve(), // 解析 Node.js 风格的模块
    commonjs(), // 转换 CommonJS 模块为 ES6
    css({ output: 'bundle.css' }), // 处理 CSS 文件
    postcss(), // 处理 CSS 文件，并支持 PostCSS
    url({ limit: 10 * 1024, include: ["**/*.svg", "**/*.png", "**/*.jpg", "**/*.gif", "**/*.woff", "**/*.woff2"], emitFiles: true }), // 处理文件资源
    terser(), // 代码压缩
    visualizer({ // 可视化打包结果
      filename: 'bundle-report.html',
      title: 'My Bundle Visualizer',
      open: true
    }),
  ]
});