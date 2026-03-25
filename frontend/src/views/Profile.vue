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

        <el-tab-pane label="收货地址" name="address">
          <div class="address-section">
            <div class="address-header">
              <h3>我的收货地址</h3>
              <el-button type="primary" @click="showAddAddressDialog">
                <el-icon><Plus /></el-icon>
                添加地址
              </el-button>
            </div>

            <div class="address-list" v-loading="addressLoading">
              <el-empty v-if="addressList.length === 0" description="暂无收货地址" />

              <el-card v-for="address in addressList" :key="address.id" class="address-card" shadow="hover">
                <div class="address-content">
                  <div class="address-info">
                    <div class="address-name">{{ address.receiver_name }}</div>
                    <div class="address-phone">
                      <el-icon><Phone /></el-icon>
                      {{ address.phone }}
                    </div>
                    <div class="address-detail">
                      <el-icon><Location /></el-icon>
                      {{ address.province }} {{ address.city }} {{ address.district }} {{ address.detail_address }}
                    </div>
                    <el-tag v-if="address.is_default" type="success" size="small">默认地址</el-tag>
                  </div>
                  <div class="address-actions">
                    <el-button
                      v-if="!address.is_default"
                      type="primary"
                      size="small"
                      @click="setDefaultAddress(address)"
                    >
                      设为默认
                    </el-button>
                    <el-button size="small" @click="editAddress(address)">编辑</el-button>
                    <el-button type="danger" size="small" @click="deleteAddress(address)">删除</el-button>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
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

    <el-dialog v-model="addressDialogVisible" :title="isEdit ? '编辑地址' : '添加地址'" width="600px">
      <el-form :model="addressForm" :rules="addressRules" ref="addressFormRef" label-width="100px">
        <el-form-item label="收货人" prop="receiver_name">
          <el-input v-model="addressForm.receiver_name" placeholder="请输入收货人姓名" />
        </el-form-item>

        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="addressForm.phone" placeholder="请输入联系电话" />
        </el-form-item>

        <el-form-item label="所在地区" prop="region">
          <el-cascader
            v-model="addressForm.region"
            :options="regionOptions"
            :props="{ expandTrigger: 'hover' }"
            placeholder="请选择省/市/区"
            @change="handleRegionChange"
          />
        </el-form-item>

        <el-form-item label="详细地址" prop="detail_address">
          <el-input v-model="addressForm.detail_address" type="textarea" :rows="3" placeholder="请输入详细地址（街道、门牌号等）" />
        </el-form-item>

        <el-form-item label="设为默认">
          <el-switch v-model="addressForm.is_default" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addressDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveAddress" :loading="addressSaving">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Van, User, Lock, Plus, Phone, Location } from '@element-plus/icons-vue'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('basic')
const profileFormRef = ref(null)
const addressFormRef = ref(null)
const saving = ref(false)
const changingPassword = ref(false)
const addressLoading = ref(false)
const addressSaving = ref(false)
const addressDialogVisible = ref(false)
const isEdit = ref(false)

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

const addressList = ref([])

const addressForm = reactive({
  id: '',
  receiver_name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail_address: '',
  is_default: false,
  region: []
})

const regionOptions = [
  {
    value: '浙江省',
    label: '浙江省',
    children: [
      {
        value: '杭州市',
        label: '杭州市',
        children: [
            { value: '西湖区', label: '西湖区' },
            { value: '上城区', label: '上城区' },
            { value: '下城区', label: '下城区' },
            { value: '江干区', label: '江干区' },
            { value: '拱墅区', label: '拱墅区' },
            { value: '滨江区', label: '滨江区' },
            { value: '萧山区', label: '萧山区' },
            { value: '余杭区', label: '余杭区' },
            { value: '临平区', label: '临平区' },
            { value: '钱塘区', label: '钱塘区' },
            { value: '富阳区', label: '富阳区' },
            { value: '临安区', label: '临安区' },
            { value: '桐庐县', label: '桐庐县' },
            { value: '淳安县', label: '淳安县' },
            { value: '建德市', label: '建德市' }
        ]
      }
    ]
  },
  {
    value: '上海市',
    label: '上海市',
    children: [
      { value: '黄浦区', label: '黄浦区' },
      { value: '徐汇区', label: '徐汇区' },
      { value: '长宁区', label: '长宁区' },
      { value: '静安区', label: '静安区' },
      { value: '普陀区', label: '普陀区' },
      { value: '虹口区', label: '虹口区' },
      { value: '杨浦区', label: '杨浦区' },
      { value: '闵行区', label: '闵行区' },
      { value: '宝山区', label: '宝山区' },
      { value: '嘉定区', label: '嘉定区' },
      { value: '浦东新区', label: '浦东新区' },
      { value: '金山区', label: '金山区' },
      { value: '松江区', label: '松江区' },
      { value: '青浦区', label: '青浦区' },
      { value: '奉贤区', label: '奉贤区' },
      { value: '崇明区', label: '崇明区' }
    ]
  },
  {
    value: '广东省',
    label: '广东省',
    children: [
      { value: '深圳市', label: '深圳市', children: [
        { value: '南山区', label: '南山区' },
        { value: '福田区', label: '福田区' },
        { value: '罗湖区', label: '罗湖区' },
        { value: '宝安区', label: '宝安区' },
        { value: '龙岗区', label: '龙岗区' },
        { value: '盐田区', label: '盐田区' },
        { value: '龙华区', label: '龙华区' },
        { value: '坪山区', label: '坪山区' },
        { value: '光明区', label: '光明区' },
        { value: '大鹏新区', label: '大鹏新区' }
      ]},
      { value: '广州市', label: '广州市', children: [
        { value: '天河区', label: '天河区' },
        { value: '越秀区', label: '越秀区' },
        { value: '海珠区', label: '海珠区' },
        { value: '荔湾区', label: '荔湾区' },
        { value: '白云区', label: '白云区' },
        { value: '黄埔区', label: '黄埔区' },
        { value: '番禺区', label: '番禺区' },
        { value: '花都区', label: '花都区' },
        { value: '南沙区', label: '南沙区' },
        { value: '增城区', label: '增城区' },
        { value: '从化区', label: '从化区' }
      ]}
    ]
  },
  {
    value: '北京市',
    label: '北京市',
    children: [
      { value: '东城区', label: '东城区' },
      { value: '西城区', label: '西城区' },
      { value: '朝阳区', label: '朝阳区' },
      { value: '丰台区', label: '丰台区' },
      { value: '石景山区', label: '石景山区' },
      { value: '海淀区', label: '海淀区' },
      { value: '门头沟区', label: '门头沟区' },
      { value: '房山区', label: '房山区' },
      { value: '通州区', label: '通州区' },
      { value: '顺义区', label: '顺义区' },
      { value: '昌平区', label: '昌平区' },
      { value: '大兴区', label: '大兴区' },
      { value: '怀柔区', label: '怀柔区' },
      { value: '平谷区', label: '平谷区' },
      { value: '密云区', label: '密云区' },
      { value: '延庆区', label: '延庆区' }
    ]
  }
]

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

const addressRules = {
  receiver_name: [
    { required: true, message: '请输入收货人姓名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入联系电话', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号码', trigger: 'blur' }
  ],
  region: [
    { required: true, message: '请选择所在地区', trigger: 'change' }
  ],
  detail_address: [
    { required: true, message: '请输入详细地址', trigger: 'blur' }
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
  loadAddressList()
})

const loadAddressList = async () => {
  addressLoading.value = true
  try {
    const response = await axios.get(`http://localhost:5001/api/customers/${profileForm.id}/addresses`)
    if (response.data.code === 200) {
      addressList.value = response.data.data || []
    } else {
      ElMessage.error(response.data.msg || '获取收货地址失败')
    }
  } catch (err) {
    console.error('获取收货地址失败：', err)
    ElMessage.error('网络错误，请检查后端服务')
  } finally {
    addressLoading.value = false
  }
}

const showAddAddressDialog = () => {
  isEdit.value = false
  resetAddressForm()
  addressDialogVisible.value = true
}

const editAddress = (address) => {
  isEdit.value = true
  Object.assign(addressForm, {
    id: address.id,
    receiver_name: address.receiver_name,
    phone: address.phone,
    province: address.province,
    city: address.city,
    district: address.district,
    detail_address: address.detail_address,
    is_default: address.is_default,
    region: [address.province, address.city, address.district]
  })
  addressDialogVisible.value = true
}

const resetAddressForm = () => {
  Object.assign(addressForm, {
    id: '',
    receiver_name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail_address: '',
    is_default: false,
    region: []
  })
}

const handleRegionChange = (value) => {
  if (value && value.length === 3) {
    addressForm.province = value[0]
    addressForm.city = value[1]
    addressForm.district = value[2]
  }
}

const saveAddress = async () => {
  if (!addressFormRef.value) return

  await addressFormRef.value.validate(async (valid) => {
    if (!valid) return

    addressSaving.value = true
    try {
      const url = isEdit.value 
        ? `http://localhost:5001/api/customers/${profileForm.id}/addresses/${addressForm.id}`
        : `http://localhost:5001/api/customers/${profileForm.id}/addresses`
      
      const method = isEdit.value ? 'put' : 'post'
      
      const response = await axios[method](url, {
        receiver_name: addressForm.receiver_name,
        phone: addressForm.phone,
        province: addressForm.province,
        city: addressForm.city,
        district: addressForm.district,
        detail_address: addressForm.detail_address,
        is_default: addressForm.is_default
      })

      if (response.data.code === 200) {
        ElMessage.success(isEdit.value ? '修改成功' : '添加成功')
        addressDialogVisible.value = false
        loadAddressList()
      } else {
        ElMessage.error(response.data.msg || '保存失败')
      }
    } catch (err) {
      console.error('保存收货地址失败：', err)
      ElMessage.error('网络错误，请检查后端服务')
    } finally {
      addressSaving.value = false
    }
  })
}

const setDefaultAddress = async (address) => {
  try {
    const response = await axios.put(`http://localhost:5001/api/customers/${profileForm.id}/addresses/${address.id}/default`)
    if (response.data.code === 200) {
      ElMessage.success('设置成功')
      loadAddressList()
    } else {
      ElMessage.error(response.data.msg || '设置失败')
    }
  } catch (err) {
    console.error('设置默认地址失败：', err)
    ElMessage.error('网络错误，请检查后端服务')
  }
}

const deleteAddress = async (address) => {
  ElMessageBox.confirm('确定要删除这个收货地址吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await axios.delete(`http://localhost:5001/api/customers/${profileForm.id}/addresses/${address.id}`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        loadAddressList()
      } else {
        ElMessage.error(response.data.msg || '删除失败')
      }
    } catch (err) {
      console.error('删除收货地址失败：', err)
      ElMessage.error('网络错误，请检查后端服务')
    }
  }).catch(() => {})
}

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
  margin-bottom: 20px;
}

.logo-title {
  margin: 0;
  color: #fff;
  font-weight: 700;
  font-size: 36px;
  letter-spacing: 2px;
}

.card-header h2 {
  margin: 0;
  color: #fff;
  font-weight: 600;
  font-size: 28px;
}

.profile-form,
.security-form {
  padding: 30px 20px;
}

.address-section {
  padding: 20px;
}

.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.address-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.address-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.address-card {
  margin-bottom: 0;
  transition: all 0.3s;
}

.address-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.address-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-info {
  flex: 1;
}

.address-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.address-phone,
.address-detail {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #606266;
  margin-bottom: 6px;
}

.address-actions {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #EBEEF5;
}

.logout-section {
  padding: 20px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.back-section {
  padding: 20px;
  text-align: center;
}
</style>
