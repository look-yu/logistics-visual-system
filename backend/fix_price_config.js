const db = require('./config/db');

async function testAndFixPriceConfig() {
  try {
    console.log('=== 开始测试和修复价格配置 ===');
    
    const sql = 'SELECT * FROM price_config WHERE id = 1';
    const [rows] = await db.query(sql);
    
    if (rows && rows.length > 0) {
      const rawData = rows[0].goods_type_multiplier;
      console.log('原始数据:', rawData);
      console.log('数据长度:', rawData.length);
      
      try {
        const parsed = JSON.parse(rawData);
        console.log('解析成功:', parsed);
        console.log('normal 倍率:', parsed.normal);
      } catch (parseErr) {
        console.error('JSON 解析失败:', parseErr.message);
        console.log('尝试修复数据...');
        
        const fixedData = {
          normal: 1.0,
          fresh: 1.5,
          electronics: 1.3,
          dangerous: 2.0,
          valuable: 2.5,
          large: 1.8
        };
        
        const updateSql = 'UPDATE price_config SET goods_type_multiplier = ? WHERE id = 1';
        await db.query(updateSql, [JSON.stringify(fixedData)]);
        
        console.log('数据已修复');
        
        const [newRows] = await db.query(sql);
        const newParsed = JSON.parse(newRows[0].goods_type_multiplier);
        console.log('修复后的数据:', newParsed);
      }
    } else {
      console.log('未找到价格配置');
    }
  } catch (err) {
    console.error('错误:', err);
  } finally {
    process.exit(0);
  }
}

testAndFixPriceConfig();
