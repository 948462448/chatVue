import http from './http.js'


// 获取对话记录
export function chat(params, header) {
    return http.postWithHeader("/api/v2/batch/chat", params, header)
}

// 获取对话记录
export function streamChat(params, handlerEvent, handlerError) {
    return http.postWithHeaderAndStream("/api/v3/stream/chat", params, handlerEvent, handlerError)
}

export function getCsrfToken() {
    return http.get("/api/v1/get/token", null)
}

export function checkUserLogin() {
    return http.get("/api/v1/check/login", null)
}

export function login(params, header) {
    return http.postWithHeader("/api/v1/login", params, header)
}

export function logout(params, header) {
    return http.postWithHeader("/api/v1/logout", params, header)
}


export function doGetChatRecordList() {
    return http.get("/api/v1/get/chat/list", null)
}


export function doGetChatRecord(params) {
    return http.get("/api/v1/get/chat/one", params)
}

export function doFlushChatRecord(params, header) {
    return http.postWithHeader("/api/v1/chat/flush", params, header)
}

export function chatStreamStop() {
    return http.chatStreamStop()
}