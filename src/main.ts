import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import VMdPreview from '@kangc/v-md-editor/lib/preview';
import '@kangc/v-md-editor/lib/style/preview.css';
import githubTheme from '@kangc/v-md-editor/lib/theme/github.js';
import '@kangc/v-md-editor/lib/theme/style/github.css';
import VueCookies from 'vue-cookies'
// highlightjs
import hljs from 'highlight.js';


VMdPreview.use(githubTheme, {
    Hljs: hljs,
  });
  

const app = createApp(App)

app.use(Antd).use(VMdPreview).use(VueCookies);
app.mount('#app')