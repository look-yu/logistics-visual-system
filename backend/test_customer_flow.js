const http = require('http');
const crypto = require('crypto');

const BASE_URL = 'localhost:5001';

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

async function testCustomerFlow() {
  console.log('=== 开始测试客户注册、登录、下单流程 ===\n');

  try {
    const testUsername = 'testuser' + Date.now();
    const testPassword = 'test123456';

    console.log('1️⃣  注册新用户');
    console.log('   用户名:', testUsername);
    console.log('   密码:', testPassword);

    const registerResult = await makeRequest('/api/auth/register', 'POST', {
      username: testUsername,
      password: testPassword
    });

    console.log('   ✅ 注册成功:', registerResult.data.msg);
    console.log('   客户代码:', registerResult.data.data.customer_code);
    console.log('   客户名称:', registerResult.data.data.customer_name);
    console.log();

    console.log('2️⃣  登录');
    const loginResult = await makeRequest('/api/auth/login', 'POST', {
      username: testUsername,
      password: testPassword
    });

    console.log('   ✅ 登录成功:', loginResult.data.msg);
    console.log('   客户信息:', JSON.stringify(loginResult.data.data, null, 2));
    console.log();

    const customer = loginResult.data.data;

    console.log('3️⃣  计算订单价格');
    const priceResult = await makeRequest('/api/price/calculate', 'POST', {
      goods_type: 'normal',
      weight: 10,
      volume: 0.5
    });

    console.log('   ✅ 价格计算成功');
    console.log('   价格明细:', JSON.stringify(priceResult.data.data, null, 2));
    console.log();

    console.log('4️⃣  创建订单');
    const orderResult = await makeRequest('/api/orders/customer', 'POST', {
      customer_id: customer.id,
      customer_code: customer.customer_code,
      customer_name: customer.customer_name,
      sender_address: '北京市朝阳区建国路88号',
      receiver_address: '上海市浦东新区陆家嘴环路1000号',
      goods_type: '普通货物',
      weight: 10,
      volume: 0.5,
      base_price: priceResult.data.data.base_price,
      weight_fee: priceResult.data.data.weight_fee,
      volume_fee: priceResult.data.data.volume_fee,
      goods_type_fee: priceResult.data.data.goods_type_fee,
      total_amount: priceResult.data.data.total_amount
    });

    console.log('   ✅ 订单创建成功:', orderResult.data.msg);
    console.log('   订单号:', orderResult.data.data.order_no);
    console.log('   订单ID:', orderResult.data.data.id);
    console.log();

    console.log('5️⃣  查询订单列表');
    const ordersResult = await makeRequest(`/api/orders?customer_id=${customer.id}`, 'GET');

    console.log('   ✅ 查询成功');
    console.log('   订单数量:', ordersResult.data.data.length);
    if (ordersResult.data.data.length > 0) {
      console.log('   最新订单:', JSON.stringify(ordersResult.data.data[0], null, 2));
    }
    console.log();

    console.log('=== ✅ 测试完成！所有功能正常 ===');

  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    if (err.response) {
      console.error('   响应状态:', err.response.status);
      console.error('   响应数据:', JSON.stringify(err.response.data, null, 2));
    } else if (err.request) {
      console.error('   请求失败，未收到响应');
    } else {
      console.error('   错误详情:', err);
    }
  }
}

testCustomerFlow();
