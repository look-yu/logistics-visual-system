<template>
  <div class="profile-page">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <div class="logo-section">
            <el-icon size="50" color="#fff"><Van /></el-icon>
            <h1 class="logo-title">物流可视化系统</h1>
          </div>
          <h2>个人中心</h2>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card">
        <el-tab-pane label="基本信息" name="basic">
          <el-form :model="profileForm" :rules="profileRules" ref="profileFormRef" label-width="120px" class="profile-form">
            <el-form-item label="用户名">
              <el-input v-model="profileForm.username" disabled />
            </el-form-item>

            <el-form-item label="客户名称">
              <el-input v-model="profileForm.customer_name" disabled />
            </el-form-item>

            <el-form-item label="客户代码">
              <el-input v-model="profileForm.customer_code" disabled />
            </el-form-item>

            <el-form-item label="联系人" prop="contact_person">
              <el-input v-model="profileForm.contact_person" placeholder="请输入联系人" />
            </el-form-item>

            <el-form-item label="联系电话" prop="contact_phone">
              <el-input v-model="profileForm.contact_phone" placeholder="请输入联系电话" />
            </el-form-item>

            <el-form-item label="联系邮箱" prop="contact_email">
              <el-input v-model="profileForm.contact_email" placeholder="请输入联系邮箱" />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleSave" :loading="saving">保存修改</el-button>
              <el-button @click="handleReset">重置</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="账户安全" name="security">
          <el-form label-width="120px" class="security-form">
            <el-form-item label="当前密码">
              <el-input type="password" value="******" disabled />
            </el-form-item>

            <el-form-item label="新密码">
              <el-input v-model="passwordForm.new_password" type="password" placeholder="请输入新密码" show-password />
            </el-form-item>

            <el-form-item label="确认密码">
              <el-input v-model="passwordForm.confirm_password" type="password" placeholder="请再次输入新密码" show-password />
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <el-divider />

      <div class="logout-section">
        <el-button type="danger" @click="handleLogout">退出登录</el-button>
      </div>

      <div class="back-section">
        <el-button @click="goBack">返回首页</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Van } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('basic')
const profileFormRef = ref(null)
const saving = ref(false)
const changingPassword = ref(false)

const profileForm = reactive({
  id: '',
  customer_code: '',
  username: '',
  customer_name: '',
  contact_person: '',
  contact_phone: '',
  contact_email: ''
})

const passwordForm = reactive({
  new_password: '',
  confirm_password: ''
})

const profileRules = {
  contact_person: [
    { required: true, message: '请输入联系人', trigger: 'blur' }
  ],
  contact_phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  contact_email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
}

onMounted(() => {
  const customer = localStorage.getItem('customer')
  if (!customer) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  const customerData = JSON.parse(customer)
  Object.assign(profileForm, customerData)
})

const handleSave = async () => {
  if (!profileFormRef.value) return

  await profileFormRef.value.validate(async (valid) => {
    if (!valid) return

    saving.value = true
    try {
      const response = await axios.put(`http://localhost:5001/api/customers/${profileForm.id}`, {
        contact_person: profileForm.contact_person,
        contact_phone: profileForm.contact_phone,
        contact_email: profileForm.contact_email
      })

      if (response.data.code === 200) {
        ElMessage.success('保存成功')
        localStorage.setItem('customer', JSON.stringify(profileForm))
      } else {
        ElMessage.error(response.data.msg || '保存失败')
      }
    } catch (err) {
      console.error('保存失败：', err)
      ElMessage.error('网络错误，请检查后端服务')
    } finally {
      saving.value = false
    }
  })
}

const handleReset = () => {
  const customer = localStorage.getItem('customer')
  if (customer) {
    const customerData = JSON.parse(customer)
    Object.assign(profileForm, customerData)
  }
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
}

const handleChangePassword = async () => {
  if (!passwordForm.new_password) {
    ElMessage.warning('请输入新密码')
    return
  }

  if (passwordForm.new_password !== passwordForm.confirm_password) {
    ElMessage.warning('两次输入的密码不一致')
    return
  }

  if (passwordForm.new_password.length < 6) {
    ElMessage.warning('密码长度不能少于6位')
    return
  }

  changingPassword.value = true
  try {
    const response = await axios.put(`http://localhost:5001/api/auth/customers/${profileForm.id}/password`, {
      new_password: passwordForm.new_password
    })

    if (response.data.code === 200) {
      ElMessage.success('密码修改成功')
      passwordForm.new_password = ''
      passwordForm.confirm_password = ''
    } else {
      ElMessage.error(response.data.msg || '密码修改失败')
    }
  } catch (err) {
    console.error('密码修改失败：', err)
    ElMessage.error('网络错误，请检查后端服务')
  } finally {
    changingPassword.value = false
  }
}

const handleLogout = () => {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    localStorage.removeItem('customer')
    ElMessage.success('已退出登录')
    router.push('/login')
  }).catch(() => {})
}

const goBack = () => {
  router.push('/customer-home')
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.profile-card {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  padding: 40px 20px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 15px;
}

.logo-title {
  color: #fff;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.card-header h2 {
  color: #fff;
  font-size: 28px;
  font-weight: 600;
  margin: 0;
}

.profile-form {
  padding: 20px;
}

.security-form {
  padding: 20px;
}

.logout-section {
  text-align: center;
  padding: 20px;
}

.back-section {
  text-align: center;
  padding: 10px 20px 20px;
}
</style>