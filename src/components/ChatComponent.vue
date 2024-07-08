<template>
    <div id="body">
        <div class="record-list">
            <div ref="callback"></div>
            <div class="logo">
                DPD
            </div>
            <div style="width: 80%; margin-left: 10%;">
                <a-divider />
            </div>
            <div class="chat-list">
                <div style="width: 80%; margin-left: 10%;">
                    <a-list size="small" item-layout="horizontal" :data-source="chatRecordTitleList">
                        <template #renderItem="{ item }">
                            <a-list-item>{{ item }}</a-list-item>
                        </template>
                    </a-list>
                </div>
            </div>
            <div class="platfrom-list">
                <a-menu id="platformLeftMenu" v-model:openKeys="openKeys" v-model:selectedKeys="selectedKeys"
                    style="width: 90%" mode="inline" :items="items" @click="handleClick"></a-menu>
                <div v-if="isLogin">
                    
                </div>
                <div v-else>
                    <LoginComponent v-if="showLogin" :open="true"
                        @close="showLogin = false; isLogin = true; doGetChatRecord()" />
                </div>

            </div>
            <div class="beian">
                <div style="text-align:center;">
                    <a href="https://beian.mps.gov.cn/" target="_blank" rel="noopener">浙公网安备33011002017141号</a>
                </div>
                <div style="text-align:center;">
                    <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener">黑ICP备2023006322号</a>
                </div>
            </div>
        </div>
        <div class="chat-container">
            <div class="message-out" ref="chatOutDiv">
                <div v-for="(message, index) in messageList" :key="index"
                    :class="['message', message.role === 'user' ? 'user' : message.role === 'system' ? 'system' : 'bot']">
                    <div v-if="message.role === 'system' && message.type === 'line'" class="divider-line">
                        <a-divider>以上为历史对话记录</a-divider>
                    </div>
                    <div v-else-if="message.role === 'system' && message.type === 'error'">
                        <div class="message bot">
                            <div class="bubble bot">
                                服务器端响应失败，请重试！
                            </div>
                        </div>
                    </div>
                    <div v-else :class="['bubble', message.role === 'user' ? 'user' : 'bot']">
                        <div v-if="message.role === 'user'">
                            {{ message.content }}
                        </div>
                        <div v-else>
                            <v-md-preview :text="message.content"></v-md-preview>
                        </div>
                    </div>
                </div>

                <div v-if="isLoading">
                    <div class="message bot">
                        <div class="bubble bot">
                            <a-spin />
                        </div>
                    </div>
                </div>
            </div>
            <div class="util-button-line">
                <div class="retry">
                    <a-button type="primary" @click="reSendMessage">重试一次</a-button>
                </div>
                <div class="clean-memery">
                    <a-button type="primary" @click="cleanMemery">清除记忆</a-button>
                </div>
            </div>
            <div class="message-input">
                <a-textarea v-model:value="sendMessageStr" :rows="4" placeholder="在此输入, ctrl + enter / shift + enter 换行"
                    :maxlength="10000" @keypress.enter="handleKeyDown" />
                <div class="send-button">
                    <a-button type="primary" :disabled="!sendMessageStr.trim()" @click="sendMessage">Send</a-button>
                </div>
            </div>

        </div>
    </div>
</template>
<style src="../assets/chat.css"></style>
<script setup>
import { ref, reactive, nextTick, watch, inject, onMounted } from 'vue'
import { chat, getCsrfToken, doGetChatRecordList } from "@/api/api";
import LoginComponent from './LoginComponent.vue';

//输入框文本
const sendMessageStr = ref("")
//历史对话信息列表
const messageList = ref([])
//当前对话信息列表
const currentMessageList = ref([])
//是否在等待应答
const isLoading = ref(false)
//是否开启输入法
const isComposing = ref(false)
//chatOut的div高度
const chatOutDiv = ref(null)
//菜单选择key
const selectedKeys = ref(['1']);
//list
const openKeys = ref(['sub1']);
//$cookies
const $cookies = inject('$cookies');

const showLogin = ref(false)

const chatId = ref(null)

const chatRecordTitleList = ref([])

const chatRecordList = ref([])

onMounted(() => {
    console.log($cookies)
  console.log(`the component is now mounted.`)
})

function doGetChatRecord() {
    doGetChatRecordList().then((req) => {
        const returnRes = req.data
        if (returnRes.code == 200) {
            let chatRecordListJson = JSON.parse(returnRes.data)
            chatRecordListJson.forEach(function (item) {
                chatRecordTitleList.value.push(item.fields.title)
                chatRecordList.value.push(item)
            });
        } else {
            message.error(req.msg);
        }
    })
}

function getItem(label, key, icon, children, type) {
    return {
        key,
        icon,
        children,
        label,
        type,
    };
}

const items = reactive([
    getItem(null, null, null, [getItem('登录', 'login'), getItem('联系我们', 'contact')], 'group'),
]);

const handleClick = e => {
    if (e.key == "login") {
        showLogin.value = true
    }
};

watch(openKeys, val => {
    console.log('openKeys', val);
});

onMounted(() => {
    if ($cookies.get("csrftoken") == "") {
        cacheCookie()
    }
})

function cacheCookie() {
    getCsrfToken().then((res) => {
        let csrftoken = getCookie("csrftoken")
        $cookies.set("csrftoken", csrftoken)
    })
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Is this cookie string starting with the name we want?
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

//发送消息
function sendMessage() {
    if ($cookies.get("csrftoken") == "") {
        cacheCookie()
    }
    messageList.value.push({ content: sendMessageStr.value, role: "user", type: "chat" })
    currentMessageList.value.push({ content: sendMessageStr.value, role: "user" })
    doSend()
    // 处理消息发送逻辑
    sendMessageStr.value = ""; // 发送消息后清空文本框
}


//发送消息
function reSendMessage() {
    const lastChat = messageList.value[messageList.value.length - 1]
    if (lastChat.role !== "user" && lastChat.chat !== "chat") {
        messageList.value.pop()
        currentMessageList.value.pop()
    }
    doSend()
    // 处理消息发送逻辑
    sendMessageStr.value = ""; // 发送消息后清空文本框
}

function doSend() {
    nextTick(() => {
        let scrollElem = chatOutDiv.value;
        scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
    });
    const param = { msg: currentMessageList.value, chatId: chatId.value }
    isLoading.value = true
    let headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    chat(param, headers).then((res) => {
        console.log("send res:", res)
        const return_res = res.data.data
        isLoading.value = false
        messageList.value.push({ content: return_res.message, role: "assistant", type: "chat" })
        currentMessageList.value.push({ content: return_res.message, role: "assistant" })
        chatId.value = return_res.id
        nextTick(() => {
            let scrollElem = chatOutDiv.value;
            scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
        });
    }).catch((err) => {
        isLoading.value = false
        messageList.value.push({ content: "服务器端响应失败，请重试！", role: "system", type: "error" })
        currentMessageList.value.push({ content: "服务器端响应失败，请重试！", role: "user" })
        console.log(err)
    });
}

//清除记忆
function cleanMemery() {
    messageList.value.push({ content: "", role: "system", type: "line" })
    nextTick(() => {
        let scrollElem = chatOutDiv.value;
        scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
    });
    currentMessageList.value = []
}

//判断按键
function handleKeyDown(e) {
    if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
        insertNewLine(e);
    } else if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
        if (e.isComposing) {
            return
        }
        nextTick(() => {
            let scrollElem = chatOutDiv.value;
            scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
        });
        e.preventDefault();
        sendMessage();
    } else {

    }
}

// command + enter / shift + enter 换行输入
function insertNewLine(e) {
    console.log("event:", e)
    const textareaEl = e.target;
    const start = textareaEl.selectionStart;
    const end = textareaEl.selectionEnd;
    if (e.shiftKey) {
        // shift + enter 自动带换行符
        sendMessageStr.value = sendMessageStr.value.substring(0, start) + sendMessageStr.value.substring(end);
    } else {
        sendMessageStr.value = sendMessageStr.value.substring(0, start) + '\n' + sendMessageStr.value.substring(end);
    }
    nextTick(() => {
        textareaEl.setSelectionRange(start + 1, start + 1);
    });
}
</script>