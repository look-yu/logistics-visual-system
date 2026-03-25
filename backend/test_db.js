const db = require('./config/db');

async function testPriceConfig() {
  try {
    const sql = 'SELECT * FROM price_config WHERE id = 1';
    const [rows] = await db.query(sql);
    
    if (rows && rows.length > 0) {
      console.log('Raw data from DB:', rows[0].goods_type_multiplier);
      const parsed = JSON.parse(rows[0].goods_type_multiplier);
      console.log('Parsed data:', parsed);
      console.log('Multiplier for normal:', parsed.normal);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testPriceConfig();
