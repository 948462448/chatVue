import http from './http.js'


// 获取对话记录
export function chat(params) {
    return http.post("/api/v2/chat/get", params)
}
