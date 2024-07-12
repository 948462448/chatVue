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
                    <a-list size="small" item-layout="horizontal" :data-source="chatRecordList"
                        :locale="{ emptyText: '登录后展示对话列表' }">
                        <template #renderItem="{ item }">
                            <a-list-item class="chat-record" slot-scope="item" @click="flushChatRecordList(item)"
                                :class="['chat-record', { 'chat-record-selected': item === chatRecordSelectItem }]">
                                <div class="chat-record-textarea">
                                    {{ item.fields.title }}
                                </div>
                            </a-list-item>
                        </template>

                    </a-list>

                </div>
            </div>
            <div class="platfrom-list">
                <a-menu id="platformLeftMenu" v-model:openKeys="openKeys" v-model:selectedKeys="selectedKeys"
                    style="width: 90%" mode="inline" :items="items" @click="handleClick"></a-menu>
                <LoginComponent v-if="showLogin" :open="true" @close="showLogin = false; doGetChatRecord()"
                    @isLogout="chatRecordTitleList = []; chatRecordList = []" />
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
                <div class="add-new-chat">
                    <a-button type="primary" @click="addNewChat">新增会话</a-button>
                </div>
                <div class="retry">
                    <a-button type="primary" @click="reSendMessage"
                        :disabled="currentMessageList.length == 0">重试一次</a-button>
                </div>
                <div class="clean-memery">
                    <a-button type="primary" @click="cleanMemery"
                        :disabled="messageList.length == 0 || messageList[messageList.length - 1].type == 'line'">清除记忆</a-button>
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
<style src="./src/assets/chat.css"></style>
<script setup>
import { ref, reactive, nextTick, watch, onMounted, getCurrentInstance } from 'vue'
import { chat, getCsrfToken, doGetChatRecordList, checkUserLogin, doFlushChatRecord, streamChat } from "@/api/api";
import LoginComponent from './LoginComponent.vue';
import { message } from 'ant-design-vue';
import { v4 as uuidv4 } from 'uuid';

//输入框文本
const sendMessageStr = ref("")
//历史对话信息列表
const messageList = ref([])
//当前对话信息列表
const currentMessageList = ref([])
//是否在等待应答
const isLoading = ref(false)
//chatOut的div高度
const chatOutDiv = ref(null)
//菜单选择key
const selectedKeys = ref(['1']);
//list
const openKeys = ref(['sub1']);

const instance = getCurrentInstance();

//$cookies
const $cookies = instance.appContext.config.globalProperties.$cookies;

const showLogin = ref(false)

const chatId = ref(null)

const chatRecordList = ref([])

const chatRecordSelectItem = ref(null)

onMounted(() => {
    if (!$cookies.get("csrftoken")) {
        cacheCookie()
    }
    doGetChatRecord()
})

function flushChatRecordList(item) {
    chatRecordSelectItem.value = item
    if (item.fields.chat.length == 0) {
        return
    }
    chatId.value = item.pk
    // 解析JSON字符串
    messageList.value = JSON.parse(item.fields.chat);
    //记录上一次清除记忆的点
    let currIndex = 0;
    for (let i = messageList.value.length - 1; i >= 0; i--) {
        let chat = messageList.value[i];
        if (chat.type == 'line' && chat.role == "system") {
            currIndex = i;
            break;
        }
    }
    currentMessageList.value = []
    for (let i = (currIndex == 0 ? 0 : currIndex + 1); i < messageList.value.length; i++) {
        currentMessageList.value.push({ content: messageList.value[i].content, role: messageList.value[i].role })
    }
}

async function doGetChatRecord() {
    const isLogin = await checkUserLogin()
    if (isLogin.data.data) {
        doGetChatRecordList().then((req) => {
            const returnRes = req.data
            if (returnRes.code == 200) {
                chatRecordList.value = []
                let chatRecordListJson = JSON.parse(returnRes.data)
                chatRecordListJson.forEach(function (item) {
                    chatRecordList.value.push(item)
                });
            } else {
                message.error(req.msg);
            }
        })
    }
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
async function sendMessage() {
    if ($cookies.get("csrftoken") == "") {
        cacheCookie()
    }
    const uuid = uuidv4().replace("-", "") 
    messageList.value.push({id: uuid + "_q", content: sendMessageStr.value, role: "user", type: "chat" })
    currentMessageList.value.push({id: uuid + "_q", content: sendMessageStr.value, role: "user", type: "chat" })
    await steamDoSend(uuid)
    // 处理消息发送逻辑
    sendMessageStr.value = ""; // 发送消息后清空文本框
    doGetChatRecord()
}


/**
 * 重新发送消息
 */
async function reSendMessage() {
    const lastChat = messageList.value[messageList.value.length - 1]
    if (lastChat.role !== "user" && lastChat.chat !== "chat") {
        messageList.value.pop()
        currentMessageList.value.pop()
    }
    const newLastChat = messageList.value[messageList.value.length - 1]
    await steamDoSend(newLastChat.id)
    // 处理消息发送逻辑
    sendMessageStr.value = ""; // 发送消息后清空文本框
    doGetChatRecord()
}

/**
 * 批请求，一次行返回回答
 *  
 * @param uuid 对话唯一ID
 */
async function doSend(uuid) {
    nextTick(() => {
        let scrollElem = chatOutDiv.value;
        scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
    });
    const param = {uuid: uuid, msg: currentMessageList.value, historyChatList: messageList.value, chatId: chatId.value }
    isLoading.value = true
    let headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    await chat(param, headers).then((res) => {
        const return_res = res.data.data
        isLoading.value = false
        messageList.value.push({id:uuid, content: return_res.message, role: "assistant", type: "chat" })
        currentMessageList.value.push({id:uuid, content: return_res.message, role: "assistant" })
        chatId.value = return_res.id
        nextTick(() => {
            let scrollElem = chatOutDiv.value;
            scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
        });
    }).catch((err) => {
        const uuid = uuidv4();
        isLoading.value = false
        messageList.value.push({id:uuid, content: "服务器端响应失败，请重试！", role: "system", type: "error" })
        currentMessageList.value.push({id:uuid, content: "服务器端响应失败，请重试！", role: "user", })
        console.log(err)
    });
}

async function steamDoSend(uuid) {
    nextTick(() => {
        let scrollElem = chatOutDiv.value;
        scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
    });
    const param = {uuid: uuid, msg: currentMessageList.value, historyChatList: messageList.value, chatId: chatId.value }
    isLoading.value = true
    let headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    streamChat(param, headers, streamResponseHandler.bind(this), streamResponseHandleError.bind(this))
    /**
     * 处理流式响应返回的消息
     */
    function streamResponseHandler(streamResopnse) {
        console.log("uuid:", uuid)
        console.info('vue 回调:', streamResopnse);
        isLoading.value = false
        if (streamResopnse.data.finish == false) {
            let existingMessage = messageList.value.find(msg => msg.id === uuid + "_a");
            if (existingMessage) {
                existingMessage.content = streamResopnse.data.message;
            } else {
                messageList.value.push({id:uuid + "_a", content: streamResopnse.data.message, role: streamResopnse.data.role, type: "chat" })
                currentMessageList.value.push({id:uuid + "_a", content: streamResopnse.data.message, role: "assistant" })
            }
        }
        chatId.value = streamResopnse.data.id
        nextTick(() => {
            let scrollElem = chatOutDiv.value;
            scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
        });
    }
    /**
     * 处理流式响应返回错误信息
     */
    function streamResponseHandleError(error) {
        console.error('stream request error:', error);
        isLoading.value = false
        messageList.value.push({id:uuid + "_a", content: "服务器端响应失败，请重试！", role: "system", type: "error" })
        currentMessageList.value.push({id:uuid + "_a", content: "服务器端响应失败，请重试！", role: "user", })
        console.log(err)
    }
}

/**
 * 清楚记忆
 */
async function cleanMemery() {

    messageList.value.push({ content: "", role: "system", type: "line" })
    nextTick(() => {
        let scrollElem = chatOutDiv.value;
        scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
    });
    let headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    let param = { historyChatList: messageList.value, chatId: chatId.value }
    await doFlushChatRecord(param, headers).then((req) => {
        if (req.data.code != 200) {
            message.error('请求失败，请联系管理员');
        }
    })
    currentMessageList.value = []

    doGetChatRecord()

}

/**
 * 添加新聊天
 */
function addNewChat() {
    messageList.value = []
    currentMessageList.value = []
    chatId.value = null
}

/**
 * 判断按键
 * @param e 按键事件 
 */
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