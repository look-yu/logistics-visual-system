const db = require('../config/db');

class PriceModel {
  // 默认价格配置
  static defaultConfig = {
    base_price: 100.0,
    weight_price: 2.0,
    volume_price: 50.0,
    goods_type_multiplier: {
      'normal': 1.0,
      'fresh': 1.5,
      'electronics': 1.3,
      'dangerous': 2.0,
      'valuable': 2.5,
      'large': 1.8
    }
  };

  // 获取价格配置
  static async getConfig() {
    try {
      const sql = 'SELECT * FROM price_config WHERE id = 1';
      const [rows] = await db.query(sql);
      
      if (rows && rows.length > 0) {
        return {
          base_price: rows[0].base_price,
          weight_price: rows[0].weight_price,
          volume_price: rows[0].volume_price,
          goods_type_multiplier: rows[0].goods_type_multiplier
        };
      }
      
      return this.defaultConfig;
    } catch (err) {
      console.warn('获取价格配置失败，使用默认配置：', err.message);
      return this.defaultConfig;
    }
  }

  // 更新价格配置
  static async updateConfig(config) {
    try {
      const { base_price, weight_price, volume_price, goods_type_multiplier } = config;
      
      const sql = `
        INSERT INTO price_config (id, base_price, weight_price, volume_price, goods_type_multiplier)
        VALUES (1, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          base_price = VALUES(base_price),
          weight_price = VALUES(weight_price),
          volume_price = VALUES(volume_price),
          goods_type_multiplier = VALUES(goods_type_multiplier)
      `;
      
      await db.query(sql, [
        base_price,
        weight_price,
        volume_price,
        JSON.stringify(goods_type_multiplier)
      ]);
      
      return true;
    } catch (err) {
      console.error('更新价格配置失败：', err);
      throw err;
    }
  }

  // 计算订单价格
  static async calculatePrice(params) {
    const { goods_type = '普通货物', weight = 1.0, volume = 0.1, base_price = 100.0 } = params;
    
    const config = await this.getConfig();
    
    const weightPrice = weight * config.weight_price;
    const volumePrice = volume * config.volume_price;
    const multiplier = config.goods_type_multiplier[goods_type] || 1.0;
    const goodsTypePrice = base_price * (multiplier - 1);
    
    const total = parseFloat(base_price) + weightPrice + volumePrice + goodsTypePrice;
    
    return {
      base_price: parseFloat(base_price).toFixed(2),
      weight_fee: weightPrice.toFixed(2),
      volume_fee: volumePrice.toFixed(2),
      goods_type_fee: goodsTypePrice.toFixed(2),
      total_amount: total.toFixed(2),
      breakdown: {
        weight_price: config.weight_price,
        volume_price: config.volume_price,
        multiplier: multiplier
      }
    };
  }
}

module.exports = PriceModel;
