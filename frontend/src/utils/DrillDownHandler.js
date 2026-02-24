
/**
 * 仅保留核心下钻解析逻辑，适配原有接口参数格式
 * 不新增任何依赖，仅解析图表点击事件生成下钻参数
 */
class DrillDownHandler {
  /**
   * 解析Echarts点击事件，生成下钻参数（适配原有后端接口）
   * @param {Object} params Echarts点击事件参数
   * @returns {Object} 下钻参数 { drillDownLevel: '', drillDimension: '' }
   */
  static parseEchartsClick(params) {
    const { name, seriesName } = params;
    let drillDownLevel = '';
    let drillDimension = '';

    // 仅保留核心下钻规则：月度→日度（适配你原有运力数据）
    if (seriesName.includes('月度') && name.match(/^\d{4}-\d{2}$/)) {
      drillDownLevel = 'day';
      drillDimension = name; // 选中的月份，如2026-02
    }

    return { drillDownLevel, drillDimension };
  }

  /**
   * 合并筛选参数和下钻参数（不新增逻辑，仅拼接）
   * @param {Object} originalParams 原有筛选参数
   * @param {Object} drillParams 下钻参数
   * @returns {Object} 最终请求参数
   */
  static mergeParams(originalParams, drillParams) {
    return {
      ...originalParams,
      drillDownLevel: drillParams.drillDownLevel,
      drillDimension: drillParams.drillDimension
    };
  }
}

export default DrillDownHandler;