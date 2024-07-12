import request from '@/api/request'
let controller = null;
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

    async postWithHeaderAndStream(url, params, onEvent, onError) {
        controller = new AbortController()
        const signal = controller.signal;
        try {
            const response = await fetch(import.meta.env.VUE_APP_API_BASE_URL + url, {
                method: 'POST',
                headers: {
                    'Accept': 'text/event-stream',
                    'X-CSRFToken': $cookies.get("csrftoken"),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
                credentials: 'include',
                signal: signal 
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    break;
                }
                buffer += decoder.decode(value, { stream: true });
                let parts = buffer.split("\n\n");
                buffer = parts.pop();
                for (let part of parts) {
                    const streamResponse = parseSSEMessage(part);
                    if (streamResponse) {
                        await onEvent(streamResponse);
                    }
                }
            }
        } catch (error) {
            onError(error);
        }

        function parseSSEMessage(data) {
            const contentString = data.replace(/^data: /, '');
            return JSON.parse(contentString);
        }

    },

    chatStreamStop() {
        controller.abort();
        console.log('Request aborted');
    }



}

//暴露接口，允许Vue文件或其他js,ts文件使用http结构体中的方法
export default http
