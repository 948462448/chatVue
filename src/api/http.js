import request from '@/api/request'
import axios from 'axios';
const source = axios.CancelToken.source();
const http = {
    get(url, params) {
        const config = {
            method: 'get',
            url: url
        }
        if (params) {
            config.params = params
        }
        return request.request(config)
    },
    post(url, params) {
        const config = {
            method: 'post',
            url: url
        }

        if (params) {
            config.data = params
        }
        return request.request(config)
    },
    postWithHeader(url, params, header) {
        const config = {
            method: 'post',
            url: url,
            headers: header
        }
        if (params) {
            config.data = params
        }
        return request.request(config)
    },

    postWithHeaderAndStream(url, params, onEvent, onError) {
        // 设定 fetch 请求
        fetch('http://localhost:8000/api/v3/stream/chat', {
            method: 'POST',
            headers: {
              'Accept': 'text/event-stream',
              'X-CSRFToken': $cookies.get("csrftoken"),
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(params),
            credentials: 'include'
          }).then(response => {
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            // 处理流数据
            reader.read().then(
                function processText({ done, value }) {
                    if (done) {
                        console.log('Stream complete');
                        return;
                    }
                    // 将读取到的 Uint8Array 转换为字符串并添加到 buffer 中
                    buffer += decoder.decode(value, { stream: true });
                    // 解析 buffer 中完整的事件
                    let parts = buffer.split("\n\n");
                    buffer = parts.pop(); // 确保最后一个部分是未完成的事件
                    for (let part of parts) {
                        const streamResponse = parseSSEMessage(part);
                        if (streamResponse) {
                            onEvent(streamResponse); // 调用回调函数传递事件
                          }
                    }
                    // 继续读取流
                    return reader.read().then(processText);
                });
            }).catch(error => {onError(error)});

        // 解析 SSE 消息
        function parseSSEMessage(data) {
            console.log("获取到的数据:", data)
            const contentString = data.replace(/^data: /, '');
            return JSON.parse(contentString)
        }
    }


}

//暴露接口，允许Vue文件或其他js,ts文件使用http结构体中的方法
export default http
