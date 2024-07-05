<template>
    <div>
        <a-modal v-model:open="open" title="登录项" @ok="handleOk" :footer="null" @cancel="handleCancel">
            <a-form :model="formState" name="normal_login" class="login-form" @finish="onFinish"
                @finishFailed="onFinishFailed">
                <a-form-item label="用户名" name="username"
                    :rules="[{ required: true, message: '请输入用户名!' }]">
                    <a-input v-model:value="formState.username">
                        <template #prefix>
                            <UserOutlined class="site-form-item-icon" />
                        </template>
                    </a-input>
                </a-form-item>

                <a-form-item label="密码" name="password"
                    :rules="[{ required: true, message: '请输入密码!' }]">
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
                    <a-button :disabled="!(formState.username && formState.password)" type="primary" html-type="submit" class="login-form-button">
                        登录
                    </a-button>
                    Or
                    <a href="">register now!</a>
                </a-form-item>
            </a-form>
        </a-modal>
    </div>
</template>
<script setup>

import { ref, computed } from 'vue';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
const emit = defineEmits({ close: Boolean })
const props = defineProps({ open: Boolean })
const loading = ref(false);
const open = ref(props.open);
const formState = ref({
    username: '',
    password: ''
});

function onFinish(values) {
    console.log("formState:", formState)
    console.log('Success:', values);
};

function onFinishFailed(errorInfo) {
    console.log('Failed:', errorInfo);
};

function handleOk() {
    loading.value = false;
    open.value = false;
    emit('close', true);
};

function handleCancel() {
    open.value = false;
    emit('close', true);
};
</script>