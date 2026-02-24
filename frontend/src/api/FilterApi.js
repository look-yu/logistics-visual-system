// 单独封装筛选 / 下钻接口请求，统一拼接参数、处理请求头，和原有 index.js 区分
import axios from 'axios';

// 复用原有axios实例，不新增实例，避免冲突
const request = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 5000
});

/**
 * 筛选/下钻请求：直接调用原有运力接口，仅新增参数传递
 * 不新增接口，仅在原有/api/dispatcher/capacity接口上追加筛选参数
 * @param {Object} params 筛选+下钻参数
 * @returns {Promise} 请求结果
 */
export const getFilteredCapacityData = (params) => {
  // 调用你原有接口，仅追加参数，无新增接口
  return request.get('/dispatcher/capacity', { params });
};

// 若需给仓储模块加筛选，同理调用原有仓储接口：/warehouse/stock
export const getFilteredStockData = (params) => {
  return request.get('/warehouse/stock', { params });
};

const baseURL = 'http://localhost:3000/api';

/**
 * 导出运力数据Excel（车辆+订单）
 * @param {object} filterParams - 筛选参数（与筛选/下钻参数一致）
 * @returns {Promise} 下载文件流
 */
export const exportCapacityExcel = async (filterParams) => {
  return await axios.post(`${baseURL}/capacity/export`, filterParams, {
    responseType: 'blob' // 关键：指定响应类型为blob（文件流）
  });
};

/**
 * 仅导出车辆数据Excel
 * @param {object} filterParams - 筛选参数
 * @returns {Promise} 下载文件流
 */
export const exportCarExcel = async (filterParams) => {
  return await axios.post(`${baseURL}/capacity/export/car`, filterParams, {
    responseType: 'blob'
  });
};