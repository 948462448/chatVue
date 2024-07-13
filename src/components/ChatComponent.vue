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
                        :locale="exmptyChatListText">
                        <template #renderItem="{ item }">
                            <a-list-item class="chat-record" slot-scope="item" @click="flushChatRecordList(item)"
                                @mouseenter="item.showOpt = true" @mouseleave="item.showOpt = false"
                                :class="['chat-record', { 'chat-record-selected': item === chatRecordSelectItem }]">
                                <template v-if="!isEditChatRecordName">
                                    <div class="chat-record-textarea">
                                        {{ item.fields.title }}
                                    </div>
                                </template>
                                <template v-else>
                                    <input v-model="renameTitle" @keyup.enter="chatRecordRename(item, renameTitle)"
                                    style="width: 100%;" placeholder="按回车确认"/>
                                </template>

                                <div v-show="item.showOpt && !isEditChatRecordName" style="display: flex;">
                                    <div @click.stop="isEditChatRecordName = true; " style="margin-right: 3px;">
                                        <FormOutlined />
                                    </div>
                                    <div @click.stop="deleteChatRecord(item)">
                                        <DeleteOutlined />
                                    </div>
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
                    @isLogout="messageList = []; chatRecordList = []; currentMessageList = []; isLogin = false;  doGetEmptyChatListText()" />
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
                <div v-if="!isStreamOpen" class="send-button">
                    <a-button type="primary" :disabled="!sendMessageStr.trim()" @click="sendMessage">Send</a-button>
                </div>
                <div v-else="isStreamOpen" class="send-button">
                    <a-button type="primary" @click="cancelChatStream" danger>Cancel</a-button>
                </div>
            </div>

        </div>
    </div>
</template>
<style src="./src/assets/chat.css"></style>
<script setup>
import { ref, reactive, nextTick, onMounted, getCurrentInstance } from 'vue'
import * as api from "@/api/api";
import LoginComponent from './LoginComponent.vue';
import { message } from 'ant-design-vue';
import { DeleteOutlined, FormOutlined } from '@ant-design/icons-vue';
import { v4 as uuidv4 } from 'uuid';

//输入框文本
const sendMessageStr = ref("")
//历史对话信息列表
const messageList = ref([])
//当前对话信息列表
const currentMessageList = ref([])
//是否在等待应答
const isLoading = ref(false)
//请求流是否打开
const isStreamOpen = ref(false)
//是否取消请求流
const isCancelStream = ref(false)
//chatOut的div高度
const chatOutDiv = ref(null)
//菜单选择key
const selectedKeys = ref([]);
const openKeys = ref([])
//DOM 实例
const instance = getCurrentInstance();
//$cookies
const $cookies = instance.appContext.config.globalProperties.$cookies;
// 是否展示登录界面
const showLogin = ref(false)
// 当前是否登录
const isLogin = ref(false)
//当前对话记录ID
const chatId = ref(null)
//聊天记录列表
const chatRecordList = ref([])
//聊天记录为空展示文本
const exmptyChatListText = ref({ emptyText: '登录后展示对话列表' })
//聊天记录选中对象
const chatRecordSelectItem = ref(null)
//是否编辑对话名字
const isEditChatRecordName = ref(false)
//编辑后的名字
const renameTitle = ref("")


onMounted(() => {
    if (!$cookies.get("csrftoken")) {
        cacheCookie()
    }
    doGetChatRecord()
})

function chatRecordRename(item, rename) {
    if(rename === "") {
        return
    }
    isEditChatRecordName.value = false;
    let params = {chatId: item.pk, title: rename}
    api.doRenameChatRecord(params).then((req) => {
        const returnRes = req.data
        if (returnRes.code == 200) {
            item.fields.title = rename
            message.success('更新成功');
            renameTitle.value = ""
        } else {
            message.error(returnRes.msg)
        }
    }) 
}

async function deleteChatRecord(item) {
    let params = { chatId: item.pk }
    await api.doDeleteChatRecord(params).then((req) => {
        const returnRes = req.data
        if (returnRes.code == 200) {
            message.success('删除成功');
        } else {
            message.error(returnRes.msg)
        }
    })
    if (chatId.value == item.pk) {
        currentMessageList.value = []
        messageList.value = []
    }
    doGetChatRecord()
}

function flushChatRecordList(item) {
    if (isEditChatRecordName.value) {
        return
    }
    chatRecordSelectItem.value = item
    if (item.fields.chat.length == 0) {
        return
    }
    chatId.value = item.pk
    console.log("chatId:", chatId.value)
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

function doGetEmptyChatListText() {
    if(isLogin.value) {
        exmptyChatListText.value = { emptyText: '请开启新对话' }
    }else {
        exmptyChatListText.value = { emptyText: '登录后展示对话列表' }
    }
}

async function doGetChatRecord() {
    const req = await api.checkUserLogin()
    isLogin.value = req.data.data
    if (req.data.data) {
        exmptyChatListText.value = { emptyText: '请开启新对话' }
        await api.doGetChatRecordList().then((req) => {
            const returnRes = req.data
            if (returnRes.code == 200) {
                chatRecordList.value = []
                let chatRecordListJson = JSON.parse(returnRes.data)
                chatRecordListJson.forEach(function (item) {
                    item["showOpt"] = false
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

const handleClick = (event) => {
    if (event.key == "login") {
        showLogin.value = true
    }
};


function cacheCookie() {
    api.getCsrfToken().then((res) => {
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
    messageList.value.push({ id: uuid + "_q", content: sendMessageStr.value, role: "user", type: "chat" })
    currentMessageList.value.push({ id: uuid + "_q", content: sendMessageStr.value, role: "user", type: "chat" })
    // 处理消息发送逻辑
    sendMessageStr.value = ""; // 发送消息后清空文本框
    await steamDoSend(uuid)
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
    // 处理消息发送逻辑
    sendMessageStr.value = ""; // 发送消息后清空文本框
    await steamDoSend(newLastChat.id)
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
    const param = { uuid: uuid, msg: currentMessageList.value, historyChatList: messageList.value, chatId: chatId.value }
    isLoading.value = true
    let headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    await api.chat(param, headers).then((res) => {
        const return_res = res.data.data
        isLoading.value = false
        messageList.value.push({ id: uuid, content: return_res.message, role: "assistant", type: "chat" })
        currentMessageList.value.push({ id: uuid, content: return_res.message, role: "assistant" })
        chatId.value = return_res.chatId
        nextTick(() => {
            let scrollElem = chatOutDiv.value;
            scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
        });
    }).catch((err) => {
        const uuid = uuidv4();
        isLoading.value = false
        messageList.value.push({ id: uuid, content: "服务器端响应失败，请重试！", role: "system", type: "error" })
        currentMessageList.value.push({ id: uuid, content: "服务器端响应失败，请重试！", role: "user", })
        console.log(err)
    });
}

async function steamDoSend(uuid) {
    return new Promise((resolve, reject) => {


        nextTick(() => {
            let scrollElem = chatOutDiv.value;
            scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
        });
        const param = { uuid: uuid, msg: currentMessageList.value, historyChatList: messageList.value, chatId: chatId.value }
        isLoading.value = true
        api.streamChat(param, streamResponseHandler.bind(this), streamResponseHandleError.bind(this))
        /**
         * 处理流式响应返回的消息
         */
        async function streamResponseHandler(streamResponse) {
            isLoading.value = false;
            isStreamOpen.value = true;
            if (streamResponse.data.finish == false) {
                let existingMessage = messageList.value.find(msg => msg.id === uuid + "_a");
                let existingCurrentMessage = currentMessageList.value.find(msg => msg.id === uuid + "_a");
                if (existingMessage) {
                    for (let char of streamResponse.data.message) {
                        existingMessage.content += char;
                        existingCurrentMessage.content += char;
                        await new Promise(resolve => setTimeout(resolve, 5)); // 等待50毫秒
                    }
                } else {
                    messageList.value.push({ id: uuid + "_a", content: streamResponse.data.message, role: streamResponse.data.role, type: "chat" });
                    currentMessageList.value.push({ id: uuid + "_a", content: streamResponse.data.message, role: streamResponse.data.role });
                    chatId.value = streamResponse.data.chatId
                }
            } else {
                //请求结束
                isStreamOpen.value = false;
                resolve(); // 流式响应完成，resolve Promise
            }

            chatId.value = streamResponse.data.chatId;
            nextTick(() => {
                let scrollElem = chatOutDiv.value;
                scrollElem.scrollTo({ top: scrollElem.scrollHeight, behavior: 'smooth' });
            });
        }

        /**
         * 处理流式响应返回错误信息
         */
        function streamResponseHandleError(error) {
            //不是用户主动取消
            if (!isCancelStream.value) {
                messageList.value.push({ id: uuid + "_a", content: "服务器端响应失败，请重试！", role: "system", type: "error" })
                currentMessageList.value.push({ id: uuid + "_a", content: "服务器端响应失败，请重试！", role: "user", })
                console.error(error)
                reject(error); // 发生错误，reject Promise
            } else {
                let existingMessage = messageList.value.find(msg => msg.id === uuid + "_a");
                let existingCurrentMessage = currentMessageList.value.find(msg => msg.id === uuid + "_a");
                existingMessage.role = "system"
                existingMessage.type = "cancle"
                existingCurrentMessage.role = "system"
                resolve(); // 用户取消，resolve Promise
            }
        }
    });
}
/**
 * 取消对话请求流
 */
function cancelChatStream() {
    isCancelStream.value = true;
    api.chatStreamStop();
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
    await api.doFlushChatRecord(param, headers).then((req) => {
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