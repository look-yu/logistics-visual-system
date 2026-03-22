const db = require('./config/db');

async function checkOrders() {
  console.log('开始检查订单数据...');
  
  try {
    const [rows] = await db.query('SELECT id, order_no, sender_address, receiver_address, status FROM orders LIMIT 10');
    console.log('数据库订单数据：');
    console.log(JSON.stringify(rows, null, 2));
    
    if (rows.length === 0) {
      console.log('数据库中没有订单数据！');
    } else {
      console.log(`找到 ${rows.length} 条订单记录`);
      
      const cityCoordinates = {
        '杭州': [120.19, 30.26],
        '上海': [121.47, 31.23],
        '深圳': [114.07, 22.62],
        '北京': [116.40, 39.90],
        '广州': [113.23, 23.16],
        '成都': [104.06, 30.67],
        '西安': [108.95, 34.27],
        '武汉': [114.31, 30.52],
        '南京': [118.78, 32.04],
        '重庆': [106.55, 29.56],
        '天津': [117.20, 39.12],
        '青岛': [120.33, 36.07],
        '沈阳': [123.43, 41.80],
        '昆明': [102.71, 25.04],
        '长沙': [112.94, 28.23],
        '郑州': [113.66, 34.75]
      };
      
      function getCoordinatesFromAddress(address) {
        if (!address) return null;
        for (const [city, coords] of Object.entries(cityCoordinates)) {
          if (address.includes(city)) {
            return coords;
          }
        }
        return null;
      }
      
      console.log('\n坐标匹配结果：');
      rows.forEach(order => {
        const senderCoord = getCoordinatesFromAddress(order.sender_address);
        const receiverCoord = getCoordinatesFromAddress(order.receiver_address);
        console.log(`订单 ${order.order_no}:`);
        console.log(`  发货地址: ${order.sender_address} -> 坐标: ${senderCoord ? JSON.stringify(senderCoord) : '未匹配'}`);
        console.log(`  收货地址: ${order.receiver_address} -> 坐标: ${receiverCoord ? JSON.stringify(receiverCoord) : '未匹配'}`);
        console.log(`  状态: ${order.status}`);
        console.log(`  可显示轨迹: ${senderCoord && receiverCoord && order.status !== 'pending' ? '是' : '否'}`);
        console.log('');
      });
    }
  } catch (err) {
    console.error('查询失败：', err.message);
  }
  
  process.exit(0);
}

checkOrders();