import { createApp } from 'vue'
import App from './App.vue'
import 'ant-design-vue/dist/reset.css';

import VMdPreview from '@kangc/v-md-editor/lib/preview';
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/style/preview.css';
import '@kangc/v-md-editor/lib/theme/style/github.css';
// highlightjs 核心代码
import hljs from 'highlight.js/lib/core';
// 按需引入语言包
import json from 'highlight.js/lib/languages/json';
import java from 'highlight.js/lib/languages/java';
import sql from 'highlight.js/lib/languages/sql';

import VueCookies from 'vue-cookies';

hljs.registerLanguage('json', json);
hljs.registerLanguage('java', java);
hljs.registerLanguage('sql', sql);

VMdPreview.use(githubTheme, {Hljs: hljs,});
const app = createApp(App)

app.use(VMdPreview)
   .use(VueCookies);

app.mount('#app')