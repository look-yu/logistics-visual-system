const mysql = require('mysql2/promise');

async function createPriceConfigTable() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'logistics_db'
  });

  try {
    console.log('开始创建价格配置表...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS price_config (
        id int NOT NULL,
        base_price decimal(10,2) NOT NULL DEFAULT '100.00' COMMENT '基础运费',
        weight_price decimal(10,2) NOT NULL DEFAULT '2.00' COMMENT '重量单价（元/公斤）',
        volume_price decimal(10,2) NOT NULL DEFAULT '50.00' COMMENT '体积单价（元/立方米）',
        goods_type_multiplier json NOT NULL COMMENT '货物类型价格倍数',
        create_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
        update_time timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createTableSQL);
    console.log('价格配置表创建成功');

    const insertDataSQL = `
      INSERT INTO price_config (id, base_price, weight_price, volume_price, goods_type_multiplier)
      VALUES (1, 100.00, 2.00, 50.00, ?)
      ON DUPLICATE KEY UPDATE
        base_price = VALUES(base_price),
        weight_price = VALUES(weight_price),
        volume_price = VALUES(volume_price),
        goods_type_multiplier = VALUES(goods_type_multiplier)
    `;

    const goodsTypeMultiplier = JSON.stringify({
      '普通货物': 1.0,
      '生鲜食品': 1.5,
      '电子产品': 1.3,
      '危险品': 2.0,
      '贵重物品': 2.5,
      '大件货物': 1.8
    });

    await connection.execute(insertDataSQL, [goodsTypeMultiplier]);
    console.log('默认价格配置插入成功');

    const [rows] = await connection.execute('SELECT * FROM price_config WHERE id = 1');
    console.log('当前价格配置：', rows[0]);

  } catch (error) {
    console.error('创建价格配置表失败：', error);
  } finally {
    await connection.end();
  }
}

createPriceConfigTable();
