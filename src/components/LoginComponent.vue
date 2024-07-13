<template>
    <div>
        <a-modal v-model:open="open" :title="!showRegisterForm ? '登录' : '注册'" @ok="handleOk" :footer="null"
            @cancel="handleOk">
            <div v-if="!showRegisterForm">
                <div v-if="$cookies.get('username') == '' || $cookies.get('username') == null">
                    <a-form :model="formState" name="normal_login" class="login-form" @finish="onLogin"
                        @finishFailed="onLoginFailed">
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

                        <a-form-item>
                            <a-space>
                                <a-button :disabled="!(formState.username && formState.password)" type="primary"
                                    html-type="submit" class="login-form-button">
                                    登录
                                </a-button>
                            </a-space>
                            Or
                            <a href="#" @click.prevent="showRegisterForm = true">注册</a>
                        </a-form-item>
                    </a-form>
                </div>
                <div v-else style="">
                    <a-form :model="formState" name="normal_logout" class="logout-form" @finish="onLogout"
                        @finishFailed="onLogoutFailed">
                        <a-form-item label="用户名" name="username">
                            <a-input v-model:value="username" @keydown.enter.prevent readonly>
                                <template #prefix>
                                    <UserOutlined class="site-form-item-icon" />
                                </template>
                            </a-input>
                        </a-form-item>
                        <a-form-item>
                            <a-space>
                                <a-button :disabled="!($cookies.get('username'))" type="primary" html-type="submit"
                                    class="logout-form-button">
                                    登出
                                </a-button>
                            </a-space>
                        </a-form-item>
                    </a-form>
                </div>
            </div>
            <!-- 注册表单 -->
            <div v-else>
                <a-form :model="registerFormState" name="normal_register" class="register-form" @finish="onRegister"
                    @finishFailed="onRegisterFailed">
                    <a-form-item label="用户名" name="username" :rules="[{ required: true, message: '请输入用户名!' }]">
                        <a-input v-model:value="registerFormState.username">
                            <template #prefix>
                                <UserOutlined class="site-form-item-icon" />
                            </template>
                        </a-input>
                    </a-form-item>

                    <a-form-item label="密码" name="password" :rules="[{ required: true, message: '请输入密码!' }]">
                        <a-input-password v-model:value="registerFormState.password">
                            <template #prefix>
                                <LockOutlined class="site-form-item-icon" />
                            </template>
                        </a-input-password>
                    </a-form-item>

                    <a-form-item label="确认密码" name="confirmPassword"
                        :rules="[{ required: true, message: '请确认密码!' }, { validator: validateConfirmPassword }]">
                        <a-input-password v-model:value="registerFormState.confirmPassword">
                            <template #prefix>
                                <LockOutlined class="site-form-item-icon" />
                            </template>
                        </a-input-password>
                    </a-form-item>

                    <a-form-item>
                        <a-space>
                            <a-button
                                :disabled="!(registerFormState.username && registerFormState.password && registerFormState.confirmPassword)"
                                type="primary" html-type="submit" class="register-form-button">
                                注册
                            </a-button>
                        </a-space>
                    </a-form-item>
                </a-form>
            </div>
        </a-modal>
    </div>
</template>
<script setup>

import { ref, getCurrentInstance } from 'vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { login, logout, register } from '@/api/api.js'
const emit = defineEmits(['close', 'isLogout'])
const props = defineProps(['open'])
const open = ref(props.open);
const formState = ref({
    username: '',
    password: ''
});

const registerFormState = ref({
    username: '',
    password: '',
    confirmPassword: ''
})
const showRegisterForm = ref(false)

const instance = getCurrentInstance();
const $cookies = instance.appContext.config.globalProperties.$cookies;
const username = $cookies.get('username')

function onRegister(values) {
    // 注册逻辑
    let param = {username: values.username,password:values.password }
    register(param).then((req) => {
        const returnRes = req.data
        if (returnRes.code == 200) {
            message.success('用户注册成功');
            showRegisterForm.value = false
        } else {
            message.error(returnRes.msg);
        }
    })
}
function onRegisterFailed(errorInfo) {
    // 注册失败逻辑
    message.error("注册失败，请联系管理员:" + errorInfo);
}

function validateConfirmPassword(rule, value) {
    return new Promise((resolve, reject) => {
        if (value !== registerFormState.value.password) {
            reject(new Error('两次输入的密码不一致!'));
        } else {
            resolve();
        }
    });
}

function onLogout(values) {
    let headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    logout(values, headers).then((req) => {
        const returnRes = req.data
        if (returnRes.code == 200) {
            handleOk()
            message.success('用户登出成功');
            $cookies.set("username", "")
            emit('isLogout', true);
        } else {
            message.error('用户登出失败,请联系管理员');
        }
    }).catch((err) => {

    })
}

function onLogin(values) {
    let headers = { "X-CSRFToken": $cookies.get("csrftoken") }
    login(values, headers).then((req) => {
        const returnRes = req.data
        if (returnRes.code == 200) {
            handleOk()
            message.success('用户登录成功');
            $cookies.set("username", returnRes.data.username)
        } else {
            message.error('用户登录失败,请检查用户名与密码');
        }
    }).catch((err) => {

    })
};

function onLogoutFailed(errorInfo) {
    console.log('Failed:', errorInfo);
}

function onLoginFailed(errorInfo) {
    console.log('Failed:', errorInfo);
};

function handleOk() {
    open.value = false;
    emit('close', true);
};
</script>