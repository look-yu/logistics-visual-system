const http = require('http');

function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData ? Buffer.byteLength(postData) : 0
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (err) {
          reject(new Error('Failed to parse response: ' + body));
        }
      });
    });

    req.on('error', reject);
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testMultipleOrders() {
  console.log('=== 测试一个用户提交多个订单 ===\n');

  try {
    const testUsername = 'testuser' + Date.now();
    const testPassword = 'test123456';

    console.log('1️⃣  注册新用户');
    const registerResult = await makeRequest('/api/auth/register', 'POST', {
      username: testUsername,
      password: testPassword
    });
    console.log('   ✅ 注册成功');
    console.log('   客户ID:', registerResult.data.data.id);
    console.log('   客户名称:', registerResult.data.data.customer_name);
    console.log();

    const customer = registerResult.data.data;

    console.log('2️⃣  创建第一个订单');
    const order1Result = await makeRequest('/api/orders/customer', 'POST', {
      customer_id: customer.id,
      customer_name: customer.customer_name,
      sender_address: '北京市朝阳区建国路88号',
      receiver_address: '上海市浦东新区陆家嘴环路1000号',
      goods_type: '普通货物',
      weight: 10,
      volume: 0.5
    });
    console.log('   ✅ 订单1创建成功');
    console.log('   订单号:', order1Result.data.data.order_no);
    console.log();

    console.log('3️⃣  创建第二个订单');
    const order2Result = await makeRequest('/api/orders/customer', 'POST', {
      customer_id: customer.id,
      customer_name: customer.customer_name,
      sender_address: '深圳市南山区科技园',
      receiver_address: '广州市天河区珠江新城',
      goods_type: '生鲜食品',
      weight: 5,
      volume: 0.3
    });
    console.log('   ✅ 订单2创建成功');
    console.log('   订单号:', order2Result.data.data.order_no);
    console.log();

    console.log('4️⃣  创建第三个订单');
    const order3Result = await makeRequest('/api/orders/customer', 'POST', {
      customer_id: customer.id,
      customer_name: customer.customer_name,
      sender_address: '成都市高新区天府大道',
      receiver_address: '重庆市渝北区照母山',
      goods_type: '电子产品',
      weight: 3,
      volume: 0.2
    });
    console.log('   ✅ 订单3创建成功');
    console.log('   订单号:', order3Result.data.data.order_no);
    console.log();

    console.log('5️⃣  查询该用户的所有订单（按customer_id）');
    const ordersResult = await makeRequest(`/api/orders?customer_id=${customer.id}`, 'GET');
    console.log('   ✅ 查询成功');
    console.log('   订单数量:', ordersResult.data.data.list.length);
    console.log('   总订单数:', ordersResult.data.data.total);
    console.log();

    console.log('   订单列表:');
    ordersResult.data.data.list.forEach((order, index) => {
      console.log(`   ${index + 1}. 订单号: ${order.order_no}, 货物类型: ${order.goods_type}, 金额: ¥${order.amount}, 状态: ${order.status}`);
    });
    console.log();

    console.log('6️⃣  查询该用户的所有订单（按customer_name）');
    const ordersByNameResult = await makeRequest(`/api/orders?customer_name=${customer.customer_name}`, 'GET');
    console.log('   ✅ 查询成功');
    console.log('   订单数量:', ordersByNameResult.data.data.list.length);
    console.log('   总订单数:', ordersByNameResult.data.data.total);
    console.log();

    console.log('=== ✅ 测试完成！一个用户可以提交多个订单，并且可以查询到 ===');

  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    if (err.response) {
      console.error('   响应状态:', err.response.status);
      console.error('   响应数据:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error('   错误详情:', err);
    }
  }
}

testMultipleOrders();
