import http from './http.js'


/**
 * 批获取对话
 * @param {请求参数} params 
 * @param {请求头} header 
 * @returns 
 */
export function chat(params, header) {
    return http.postWithHeader("/api/v2/batch/chat", params, header)
}

/**
 * 获取流式对话
 * @param { 请求参数 } params 
 * @param { 回调函数 } handlerEvent 
 * @param { 错误回调函数 } handlerError 
 * @returns 
 */
export function streamChat(params, handlerEvent, handlerError) {
    return http.postWithHeaderAndStream("/api/v3/stream/chat", params, handlerEvent, handlerError)
}

/**
 * 获取对话记录列表
 * @returns 对话记录列表
 */
export function doGetChatRecordList() {
    return http.get("/api/v1/get/chat/list", null)
}
/**
 * 重命名对话记录
 * @param {重命名信息} params 
 */
export function doRenameChatRecord(params) {
    const headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    return http.postWithHeader("/api/v1/chat/rename", params, headers)
}

/**
 * 删除对话列表
 * @param {删除对话信息} params 
 */
export function doDeleteChatRecord(params) {
    const headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    return http.postWithHeader("/api/v1/chat/delete", params, headers)
}

/**
 * 获取csrftoken
 * @returns 
 */
export function getCsrfToken() {
    return http.get("/api/v1/get/token", null)
}

/**
 * 检查当前用户登录
 * @returns 
 */
export function checkUserLogin() {
    return http.get("/api/v1/check/login", null)
}

/**
 * 注册
 * @param {*} params 用户信息
 * @returns 注册结果
 */
export function register(params) {
    const headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    return http.postWithHeader("/api/v1/register", params, headers)
}

/**
 * 登录
 * @param {*} params 用户信息
 * @param {*} header 请求头
 * @returns 登录结果
 */
export function login(params, header) {
    return http.postWithHeader("/api/v1/login", params, header)
}
/**
 * 登出
 * @param {*} params 请求参数
 * @param {*} header 请求头
 * @returns 登出
 */
export function logout(params, header) {
    return http.postWithHeader("/api/v1/logout", params, header)
}

/**
 * 获取对话记录
 * @param {*} params 请求参数
 * @returns 对话记录列表
 */
export function doGetChatRecord(params) {
    return http.get("/api/v1/get/chat/one", params)
}
/**
 * 刷新对话记录
 * @param {*} params 请求参数
 * @param {*} header 请求头
 * @returns 
 */
export function doFlushChatRecord(params, header) {
    return http.postWithHeader("/api/v1/chat/flush", params, header)
}
/**
 * 停止流式对话
 * @returns 控制流式对话控制器
 */
export function chatStreamStop() {
    return http.chatStreamStop()
}