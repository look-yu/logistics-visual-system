const mysql = require('mysql2/promise');
const fs = require('fs');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'logistics_db'
};

const cityCoords = {
  '北京': [116.4074, 39.9042],
  '上海': [121.4737, 31.2304],
  '广州': [113.2644, 23.1291],
  '深圳': [114.0579, 22.5431],
  '杭州': [120.1551, 30.2741],
  '南京': [118.7969, 32.0603],
  '武汉': [114.3054, 30.5931],
  '成都': [104.0665, 30.5723],
  '重庆': [106.5516, 29.5630],
  '西安': [108.9398, 34.3416],
  '天津': [117.2009, 39.0842],
  '苏州': [120.5853, 31.2989],
  '青岛': [120.3826, 36.0671],
  '大连': [121.6147, 38.9140],
  '沈阳': [123.4315, 41.8057],
  '长沙': [112.9388, 28.2282],
  '郑州': [113.6253, 34.7466],
  '济南': [117.1205, 36.6510],
  '福州': [119.2965, 26.0745],
  '厦门': [118.0894, 24.4798],
  '昆明': [102.8329, 24.8801],
  '贵阳': [106.6302, 26.6477],
  '兰州': [103.8343, 36.0611],
  '乌鲁木齐': [87.6168, 43.8256],
  '哈尔滨': [126.5349, 45.8038],
  '长春': [125.3245, 43.8868],
  '石家庄': [114.5149, 38.0423],
  '太原': [112.5489, 37.8706],
  '合肥': [117.2272, 31.8206],
  '南昌': [115.8579, 28.6829],
  '南宁': [108.3665, 22.8172],
  '海口': [110.1999, 20.0174],
  '三亚': [109.5122, 18.2528],
  '呼和浩特': [111.7492, 40.8426],
  '银川': [106.2309, 38.4872],
  '西宁': [101.7782, 36.6171],
  '拉萨': [91.1172, 29.6469],
  '襄阳': [112.1443, 32.0098],
  '莫斯科': [37.6173, 55.7558]
};

async function updateOrderCoords() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    console.log('开始更新订单坐标...');
    
    const [orders] = await connection.query(
      'SELECT id, order_no, sender_address, receiver_address FROM orders'
    );
    
    console.log(`找到 ${orders.length} 条订单`);
    
    let updatedCount = 0;
    
    for (const order of orders) {
      let senderCoord = null;
      let receiverCoord = null;
      
      for (const [city, coords] of Object.entries(cityCoords)) {
        if (order.sender_address.includes(city)) {
          senderCoord = coords.join(',');
          break;
        }
      }
      
      for (const [city, coords] of Object.entries(cityCoords)) {
        if (order.receiver_address.includes(city)) {
          receiverCoord = coords.join(',');
          break;
        }
      }
      
      if (senderCoord && receiverCoord) {
        await connection.query(
          'UPDATE orders SET sender_coord = ?, receiver_coord = ? WHERE id = ?',
          [senderCoord, receiverCoord, order.id]
        );
        updatedCount++;
        console.log(`更新订单 ${order.order_no}: 发货地=${senderCoord}, 收货地=${receiverCoord}`);
      } else {
        console.log(`跳过订单 ${order.order_no}: 无法识别城市`);
      }
    }
    
    console.log(`成功更新 ${updatedCount} 条订单的坐标`);
    
    await connection.end();
    console.log('数据库连接已关闭');
    
  } catch (error) {
    console.error('更新订单坐标失败:', error);
    process.exit(1);
  }
}

updateOrderCoords();