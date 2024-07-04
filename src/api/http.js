import request from '@/api/request'
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
    }
}

//暴露接口，允许Vue文件或其他js,ts文件使用http结构体中的方法
export default http
