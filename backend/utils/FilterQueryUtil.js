// 筛选查询工具类：统一拼接时间 / 区域 / 下钻层级的 SQL 条件，避免 Controller 重复写逻辑
/**
 * 筛选/下钻查询工具类：统一处理前端传参，生成数据库查询条件
 * 核心：解析时间范围、区域、下钻维度，适配MySQL语法，防SQL注入，增强容错
 * 适配场景：运力调度/大屏的筛选、下钻查询（省/市/区三级区域下钻）
 */
class FilterQueryUtil {
  /**
   * 解析前端时间范围参数（格式："2026-02-01至2026-02-23"）
   * @param {string} timeRange - 前端传的时间范围字符串（空/非法值自动返回null）
   * @returns {object} { startTime, endTime } MySQL兼容的时间字符串（YYYY-MM-DD HH:mm:ss）
   */
  static parseTimeRange(timeRange) {
    // 容错：空值/非"至"分隔的字符串直接返回空
    if (!timeRange || !timeRange.includes('至')) {
      return { startTime: null, endTime: null };
    }

    const [startStr, endStr] = timeRange.split('至');
    const parseDate = (dateStr) => {
      const date = new Date(dateStr);
      // 容错：无效日期返回null（避免Invalid Date）
      return isNaN(date.getTime()) ? null : date.toISOString().slice(0, 19).replace('T', ' ');
    };

    return {
      startTime: parseDate(startStr),
      endTime: parseDate(endStr)
    };
  }

  /**
   * 校验下钻参数合法性（辅助方法）
   * @param {object} drillParams - 下钻参数（drillDownLevel/drillDimension）
   * @returns {boolean} 参数是否合法
   */
  static validateDrillParams(drillParams) {
    const { drillDownLevel, drillDimension } = drillParams;
    // 合法下钻层级：province（省）/city（市）/district（区）；合法维度：area（区域）
    const validLevels = ['province', 'city', 'district'];
    const validDimensions = ['area'];
    return validLevels.includes(drillDownLevel) && validDimensions.includes(drillDimension);
  }

  /**
   * 解析筛选/下钻参数，生成MySQL查询条件（防SQL注入）
   * @param {object} params - 前端传参 { area, drillDownLevel, drillDimension, timeRange }
   * @returns {object} { whereSql, queryParams } 
   *   - whereSql: 拼接后的WHERE条件字符串（如 "create_time >= ? AND city = ?"）
   *   - queryParams: 绑定的参数数组（与whereSql的?一一对应，防注入）
   */
  static buildFilterCondition(params = {}) {
    // 解构参数并设置默认值，避免解构报错
    const { 
      area = 'all', 
      drillDownLevel = '', 
      drillDimension = '', 
      timeRange = '' 
    } = params;

    const whereSql = [];
    const queryParams = [];

    // 1. 时间范围条件（核心修复：完善解析+容错）
    const { startTime, endTime } = this.parseTimeRange(timeRange);
    if (startTime) {
      whereSql.push('create_time >= ?');
      queryParams.push(startTime);
    }
    if (endTime) {
      whereSql.push('create_time <= ?');
      queryParams.push(endTime);
    }

    // 2. 区域筛选 + 下钻条件（核心修复：补全下钻逻辑+语法闭合）
    // 基础区域筛选（未下钻时：筛选指定区域）
    if (area && area !== 'all') {
      // 下钻参数合法：按下钻层级筛选对应字段
      if (this.validateDrillParams({ drillDownLevel, drillDimension })) {
        // 映射下钻层级到数据库字段（省/市/区）
        const levelToField = {
          province: 'province', // 数据库省字段
          city: 'city',         // 数据库市字段
          district: 'district'  // 数据库区字段
        };
        const field = levelToField[drillDownLevel];
        whereSql.push(`${field} = ?`);
        queryParams.push(area);
      } else {
        // 未下钻/下钻参数非法：默认按city筛选（兼容原有逻辑）
        whereSql.push('city = ?');
        queryParams.push(area);
      }
    }

    // 3. 拼接最终WHERE条件（无条件时返回空字符串，避免SQL语法错误）
    const finalWhereSql = whereSql.length > 0 ? whereSql.join(' AND ') : '';

    return {
      whereSql: finalWhereSql,
      queryParams: queryParams
    };
  }
}

// 导出（供后端控制器/服务层调用）
module.exports = FilterQueryUtil;