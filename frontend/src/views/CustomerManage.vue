<template>
  <div class="customer-page">
    <el-card>
      <template #header>
        <div class="filter-bar">
          <el-form :inline="true" :model="queryParams">
            <el-form-item label="客户名称">
              <el-input v-model="queryParams.keyword" placeholder="输入名称或编号" clearable />
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
        <el-table-column prop="contact_email" label="联系邮箱" show-overflow-tooltip />
        <el-table-column prop="total_orders" label="总订单数" width="100" />
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
        <el-descriptions-item label="总订单数">{{ currentCustomer.total_orders }}</el-descriptions-item>
        <el-descriptions-item label="最后下单日期">{{ currentCustomer.last_order_date || '-' }}</el-descriptions-item>
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
  page: 1,
  pageSize: 10
})

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
