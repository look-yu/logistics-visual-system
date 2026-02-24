// 	导出工具类：调用导出接口、接收文件流、触发浏览器下载、处理无数据 / 失败场景
/**
 * Excel导出工具类：全局复用
 * 核心能力：
 * 1. 前置无数据校验
 * 2. 统一调用导出接口（支持任意导出接口传入）
 * 3. Blob文件流处理 + 浏览器下载
 * 4. 分级异常提示（网络/后端/其他）
 * 5. 兼容不同导出接口的参数/响应格式
 */
import { ElMessage } from 'element-plus'

/**
 * 核心导出方法
 * @param {Object} options - 导出配置项
 * @param {Function} options.api - 导出接口方法（如exportCapacityExcel）
 * @param {Object} [options.params={}] - 导出接口参数（如筛选参数）
 * @param {string} [options.fileNamePrefix='导出数据'] - 下载文件名称前缀
 * @param {Array|Function} [options.checkData] - 无数据校验：传数组则判断长度，传函数则执行函数返回布尔
 * @returns {Promise<boolean>} 导出是否成功
 */
export const downloadExcel = async (options) => {
  const {
    api,
    params = {},
    fileNamePrefix = '导出数据',
    checkData
  } = options

  // 1. 前置无数据校验
  if (checkData) {
    let isEmpty = false
    // 支持数组直接判断长度 / 自定义校验函数
    if (Array.isArray(checkData)) {
      isEmpty = checkData.every(item => item.length === 0)
    } else if (typeof checkData === 'function') {
      isEmpty = !checkData()
    }
    if (isEmpty) {
      ElMessage.warning('当前无可用数据，无法导出Excel！')
      return false
    }
  }

  try {
    // 2. 调用导出接口（接口需提前封装为返回Promise的方法，且指定responseType: blob）
    const res = await api(params)

    // 3. 处理文件流（兼容后端不同的响应头格式）
    const blob = new Blob([res.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl

    // 4. 处理文件名（优先后端响应头 → 自定义前缀）
    let fileName = `${fileNamePrefix}_${new Date().getTime()}.xlsx`
    if (res.headers['content-disposition']) {
      fileName = decodeURIComponent(
        res.headers['content-disposition'].split('filename=')[1] || fileName
      )
    }
    a.download = fileName
    a.click()

    // 5. 释放临时URL，避免内存泄漏
    window.URL.revokeObjectURL(downloadUrl)

    ElMessage.success('Excel导出成功！文件已开始下载')
    return true
  } catch (error) {
    // 6. 分级异常提示（用户友好）
    if (error.response) {
      // 后端返回错误（如500/400）
      ElMessage.error(`Excel导出失败：${error.response.data?.msg || '服务器处理异常'}`)
    } else if (error.request) {
      // 网络错误（无响应）
      ElMessage.error('Excel导出失败：网络异常，请检查连接')
    } else {
      // 其他错误（如参数处理/接口封装失败）
      ElMessage.error(`Excel导出失败：${error.message}`)
    }
    return false
  }
}

/**
 * 简化版导出方法（适用于无需复杂校验的场景）
 * @param {Function} api - 导出接口
 * @param {Object} params - 导出参数
 * @param {string} fileName - 文件名前缀
 */
export const simpleDownloadExcel = async (api, params, fileName) => {
  return await downloadExcel({
    api,
    params,
    fileNamePrefix: fileName
  })
}