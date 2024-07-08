<template>
    <div>
        <a-modal v-model:open="open" title="登录项" @ok="handleOk" :footer="null" @cancel="handleOk">
            <div v-if="!loginSuccess">
                <a-form :model="formState" name="normal_login" class="login-form" @finish="onFinish"
                    @finishFailed="onFinishFailed">
                    <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名!' }]">
                        <a-input v-model:value="formState.username">
                            <template #prefix>
                                <UserOutlined class="site-form-item-icon" />
                            </template>
                        </a-input>
                    </a-form-item>

                    <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码!' }]">
                        <a-input-password v-model:value="formState.password">
                            <template #prefix>
                                <LockOutlined class="site-form-item-icon" />
                            </template>
                        </a-input-password>
                    </a-form-item>

                    <!-- <a-form-item> -->
                    <!-- <a-form-item name="remember" no-style>
                        <a-checkbox v-model:checked="formState.remember">Remember me</a-checkbox>
                    </a-form-item> -->
                    <!-- <a class="login-form-forgot" href="">Forgot password</a> -->
                    <!-- </a-form-item> -->

                    <a-form-item>
                        <a-space>
                            <a-button :disabled="!(formState.username && formState.password)" type="primary"
                                html-type="submit" class="login-form-button">
                                登录
                            </a-button>
                        </a-space>
                        Or
                        <a href="">register now!</a>
                    </a-form-item>
                </a-form>
            </div>

        </a-modal>
    </div>
</template>
<script setup>

import { ref } from 'vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { login } from '@/api/api.js'
const emit = defineEmits([ 'close' ])
const props = defineProps(['open'])
const open = ref(props.open);
const loginSuccess = ref(false);
const formState = ref({
    username: '',
    password: ''
});

function onFinish(values) {
    let headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    login(values, headers).then((req) => {
        const returnRes = req.data
        if (returnRes.code == 200) {
            handleOk()
            message.success('用户登录成功');
            $cookies.set("username", returnRes.data.username)
        }else{
            message.error('用户登录失败,请检查用户名与密码');
        }
    }).catch((err) => {

    })
};

function onFinishFailed(errorInfo) {
    console.log('Failed:', errorInfo);
};

function handleOk() {
    open.value = false;
    emit('close', true);
};
</script>