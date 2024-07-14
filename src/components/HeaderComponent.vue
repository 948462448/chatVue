<!-- 网站顶部导航栏 -->
<template>
    <div class="header">
        <div class="logo">
            DPD
        </div>
        <div class="first-level-menu">
            <a-menu id="firstLevelMenuId" v-model:selectedKeys="current" mode="horizontal" :items="firstLevelMenuItem"
                @click="handleClickMenu" />
        </div>
        <div>
            <div v-if="isShowmMlestone">
                <a-modal v-model:open="isShowmMlestone" title="里程碑" width="800px" :footer="null" @cancel="milestoneClose">
                    <a-timeline>
                        <a-timeline-item>立项、构建项目仓库 | 2024-06-23</a-timeline-item>
                        <a-timeline-item>V0.1 版上线：在线对话界面构建、大模型接口接入 | 2024-06-25</a-timeline-item>
                        <a-timeline-item>V0.2 版上线: 新增用户登入登出、对话列表、清除记忆、重试请求 | 2024-07-09</a-timeline-item>
                        <a-timeline-item>V0.3 版上线: 新增用户注册、流式对话、新增会话、对话重命名、对话删除、顶端导航栏、里程碑 | 2024-07-14</a-timeline-item>
                        <a-timeline-item>V0.4 版计划: 新增Agent,包括不限于: 翻译、智能总结、RAG增强搜索组件 | 预计上线: 2024-08-01</a-timeline-item>
                    </a-timeline>
                </a-modal>
            </div>
        </div>
    </div>
</template>
<style src="./src/assets/header.css"></style>
<script setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue';

const current = ref([]);
const firstLevelMenuItem = ref([
    {
        key: 'chat',
        label: '对话',
        title: '与AI对话',
    },
    // {
    //     key: 'agent',
    //     label: 'Agent广场',
    //     title: '官方Agent+自定义Agent',
    // },
    {
        key: 'milestone',
        label: '里程碑',
        title: '开发里程碑',
    },
]);
//是否展示里程碑弹窗
const isShowmMlestone = ref(false)

function handleClickMenu(item) {
    if (item.key === "milestone") {
        isShowmMlestone.value = true
    }else if(item.key === "agent") {
        message.warn("该功能暂未开放，敬请期待~~~")
        console.log(current.value)
        current.value = ["chat"]
    }
}

function milestoneClose() {
    isShowmMlestone.value = false
    current.value = ["chat"]
}
</script>