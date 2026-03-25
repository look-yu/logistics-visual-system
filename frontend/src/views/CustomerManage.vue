<template>
  <div class="customer-page">
    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-form :inline="true" :model="queryParams">
            <el-form-item label="客户名称">
              <el-input v-model="queryParams.keyword" placeholder="输入名称或编号" clearable />
            </el-form-item>
            <el-form-item label="客户类型">
              <el-select v-model="queryParams.customer_type" placeholder="全部类型" clearable style="width: 150px">
                <el-option label="普通客户" value="regular" />
                <el-option label="VIP客户" value="vip" />
                <el-option label="战略客户" value="strategic" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="queryParams.status" placeholder="全部状态" clearable style="width: 150px">
                <el-option label="活跃" value="active" />
                <el-option label="停用" value="inactive" />
                <el-option label="冻结" value="blocked" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleQuery">查询</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-table :data="customerList" border stripe v-loading="loading" style="width: 100%">
        <el-table-column prop="customer_code" label="客户编号" width="140" />
        <el-table-column prop="customer_name" label="客户名称" width="160" />
        <el-table-column prop="contact_person" label="联系人" width="110" />
        <el-table-column prop="contact_phone" label="联系电话" width="140" />
        <el-table-column prop="contact_email" label="联系邮箱" width="200" show-overflow-tooltip />
        <el-table-column prop="customer_type" label="客户类型" width="110">
          <template #default="{ row }">
            <el-tag :type="customerTypeTypeMap[row.customer_type]">{{ customerTypeNameMap[row.customer_type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_rating" label="信用等级" width="100">
          <template #default="{ row }">
            <el-tag :type="creditRatingTypeMap[row.credit_rating]">{{ row.credit_rating }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_limit" label="信用额度" width="130">
          <template #default="{ row }">
            ¥{{ Number(row.credit_limit).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="total_orders" label="总订单数" width="100" />
        <el-table-column prop="total_amount" label="总交易额" width="140">
          <template #default="{ row }">
            ¥{{ Number(row.total_amount).toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusNameMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page="queryParams.page"
          :page-size="queryParams.pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="showDetailDialog" title="客户详情" width="900px">
      <el-descriptions :column="2" border v-if="currentCustomer">
        <el-descriptions-item label="客户编号">{{ currentCustomer.customer_code }}</el-descriptions-item>
        <el-descriptions-item label="客户名称">{{ currentCustomer.customer_name }}</el-descriptions-item>
        <el-descriptions-item label="联系人">{{ currentCustomer.contact_person }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ currentCustomer.contact_phone }}</el-descriptions-item>
        <el-descriptions-item label="联系邮箱">{{ currentCustomer.contact_email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="公司地址">{{ currentCustomer.company_address || '-' }}</el-descriptions-item>
        <el-descriptions-item label="客户类型">
          <el-tag :type="customerTypeTypeMap[currentCustomer.customer_type]">{{ customerTypeNameMap[currentCustomer.customer_type] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="信用等级">
          <el-tag :type="creditRatingTypeMap[currentCustomer.credit_rating]">{{ currentCustomer.credit_rating }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="信用额度">¥{{ Number(currentCustomer.credit_limit).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="总订单数">{{ currentCustomer.total_orders }}</el-descriptions-item>
        <el-descriptions-item label="总交易额">¥{{ Number(currentCustomer.total_amount).toFixed(2) }}</el-descriptions-item>
        <el-descriptions-item label="最后下单日期">{{ currentCustomer.last_order_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusTypeMap[currentCustomer.status]">{{ statusNameMap[currentCustomer.status] }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ currentCustomer.create_time }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentCustomer.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>

      <el-divider content-position="left">最近订单</el-divider>
      <el-table :data="currentCustomer.recent_orders || []" border stripe size="small" max-height="200">
        <el-table-column prop="order_no" label="订单编号" width="120" />
        <el-table-column prop="start_city" label="出发地" width="100" />
        <el-table-column prop="end_city" label="目的地" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="150" />
      </el-table>

      <el-divider content-position="left">服务请求</el-divider>
      <el-table :data="currentCustomer.recent_requests || []" border stripe size="small" max-height="200">
        <el-table-column prop="request_no" label="请求编号" width="120" />
        <el-table-column prop="request_title" label="标题" width="150" />
        <el-table-column prop="request_type" label="类型" width="80" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="150" />
      </el-table>

      <template #footer>
        <el-button type="primary" @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const customerList = ref([])
const total = ref(0)
const showDetailDialog = ref(false)
const currentCustomer = ref(null)

const queryParams = reactive({
  keyword: '',
  customer_type: '',
  status: '',
  page: 1,
  pageSize: 10
})

const customerTypeNameMap = {
  regular: '普通客户',
  vip: 'VIP客户',
  strategic: '战略客户'
}

const customerTypeTypeMap = {
  regular: '',
  vip: 'warning',
  strategic: 'danger'
}

const creditRatingTypeMap = {
  A: 'success',
  B: '',
  C: 'warning',
  D: 'danger'
}

const statusNameMap = {
  active: '活跃',
  inactive: '停用',
  blocked: '冻结'
}

const statusTypeMap = {
  active: 'success',
  inactive: 'info',
  blocked: 'danger'
}

const handleQuery = async () => {
  loading.value = true
  try {
    const res = await axios.get('http://localhost:5001/api/customers', {
      params: queryParams
    })
    if (res.data.code === 200) {
      customerList.value = res.data.data.list
      total.value = res.data.data.total
    }
  } catch (err) {
    ElMessage.error('获取客户列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  queryParams.page = page
  handleQuery()
}

const handleSizeChange = (size) => {
  queryParams.pageSize = size
  queryParams.page = 1
  handleQuery()
}

const handleDetail = async (row) => {
  try {
    const res = await axios.get(`http://localhost:5001/api/customers/${row.id}`)
    if (res.data.code === 200) {
      currentCustomer.value = res.data.data
      showDetailDialog.value = true
    }
  } catch (err) {
    ElMessage.error('获取客户详情失败')
  }
}

onMounted(() => {
  handleQuery()
})
</script>

<style scoped>
.customer-page {
  padding: 20px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
