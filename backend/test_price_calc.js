const db = require('./config/db');

async function testPriceCalculation() {
  try {
    const sql = 'SELECT * FROM price_config WHERE id = 1';
    const [rows] = await db.query(sql);
    
    if (rows && rows.length > 0) {
      console.log('Raw data from DB:', rows[0].goods_type_multiplier);
      const parsed = JSON.parse(rows[0].goods_type_multiplier);
      console.log('Parsed data:', parsed);
      
      const goodsType = 'normal';
      const weight = 10;
      const volume = 0.5;
      const basePrice = parseFloat(rows[0].base_price);
      
      const weightPrice = weight * parseFloat(rows[0].weight_price);
      const volumePrice = volume * parseFloat(rows[0].volume_price);
      const multiplier = parsed[goodsType] || 1.0;
      const goodsTypePrice = basePrice * (multiplier - 1);
      
      const total = basePrice + weightPrice + volumePrice + goodsTypePrice;
      
      console.log('Price calculation:');
      console.log('  Base price:', basePrice);
      console.log('  Weight price:', weightPrice);
      console.log('  Volume price:', volumePrice);
      console.log('  Goods type multiplier:', multiplier);
      console.log('  Goods type price:', goodsTypePrice);
      console.log('  Total:', total);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testPriceCalculation();
