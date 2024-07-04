import http from './http.js'


// 获取对话记录
export function chat(params, header) {
    return http.postWithHeader("/api/v2/chat/get", params, header)
}

export function getCsrfToken() {
    return http.get("/api/v1/get/token", null)
}
