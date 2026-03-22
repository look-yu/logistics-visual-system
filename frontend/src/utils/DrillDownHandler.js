
// backend/utils/DrillDownHandler.js （建议修正文件名，和类名统一，避免混淆）
/**
 * 下钻逻辑工具类：解析图表点击维度、更新下钻参数、合并筛选参数
 * 修复点：空值校验、正则严谨性、异常捕获、参数兜底
 */
class DrillDownHandler {
  /**
   * 解析Echarts点击事件，生成下钻参数（适配原有后端接口）
   * @param {Object} params Echarts点击事件参数（可能为undefined/null）
   * @returns {Object} 下钻参数 { drillDownLevel: '', drillDimension: '' }
   */
  static parseEchartsClick(params) {
    // 修复1：空值兜底，避免访问undefined/null的属性
    if (!params || typeof params !== 'object') {
      console.warn('Echarts点击参数为空或格式错误：', params);
      return { drillDownLevel: '', drillDimension: '' };
    }

    // 修复2：解构时添加默认值，避免属性不存在报错
    const { name = '', seriesName = '' } = params;
    let drillDownLevel = '';
    let drillDimension = '';

    try {
      // 修复3：增强类型校验 + 正则严谨性（校验月份为01-12）
      const isSeriesValid = typeof seriesName === 'string' && seriesName.includes('月度');
      const monthReg = /^\d{4}-(0[1-9]|1[0-2])$/; // 匹配2026-01 ~ 2026-12
      const isNameValid = typeof name === 'string' && monthReg.test(name);

      // 仅保留核心下钻规则：月度→日度（适配你原有运力数据）
      if (isSeriesValid && isNameValid) {
        drillDownLevel = 'day';
        drillDimension = name; // 选中的月份，如2026-02
      }
    } catch (error) {
      // 修复4：新增异常捕获，避免解析出错导致接口崩溃
      console.error('解析Echarts下钻参数失败：', error);
      return { drillDownLevel: '', drillDimension: '' };
    }

    return { drillDownLevel, drillDimension };
  }

  /**
   * 合并筛选参数和下钻参数（不新增逻辑，仅拼接）
   * @param {Object} originalParams 原有筛选参数（可能为undefined/null）
   * @param {Object} drillParams 下钻参数（可能为undefined/null）
   * @returns {Object} 最终请求参数
   */
  static mergeParams(originalParams, drillParams) {
    // 修复5：参数兜底，避免传入undefined导致合并丢失数据
    const safeOriginal = originalParams || {};
    const safeDrill = drillParams || { drillDownLevel: '', drillDimension: '' };

    return {
      ...safeOriginal,
      drillDownLevel: safeDrill.drillDownLevel,
      drillDimension: safeDrill.drillDimension
    };
  }

  /**
   * 新增：返回上一级下钻参数重置（补充原有缺失的回退逻辑）
   * @param {Object} currentParams 当前筛选参数
   * @returns {Object} 重置后的参数
   */
  static resetDrillParams(currentParams) {
    const safeParams = currentParams || {};
    return {
      ...safeParams,
      drillDownLevel: '',
      drillDimension: ''
    };
  }
}

// 修复6：规范导出（适配Node.js CommonJS模块化）
module.exports = DrillDownHandler;

export default DrillDownHandler;