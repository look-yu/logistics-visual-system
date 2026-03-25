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

async function testLogin123() {
  console.log('=== 测试用户 123 登录 ===\n');

  try {
    console.log('📝 登录信息');
    console.log('   用户名: 123');
    console.log('   密码: 123456');
    console.log();

    console.log('🌐 发送登录请求到后端...');
    const loginResult = await makeRequest('/api/auth/login', 'POST', {
      username: '123',
      password: '123456'
    });

    console.log();
    console.log('📊 响应结果');
    console.log('   HTTP 状态码:', loginResult.status);
    console.log('   响应代码:', loginResult.data.code);
    console.log('   响应消息:', loginResult.data.msg);
    console.log();

    if (loginResult.data.code === 200) {
      console.log('✅ 登录成功！');
      console.log('   客户信息:');
      console.log('     ID:', loginResult.data.data.id);
      console.log('     用户名:', loginResult.data.data.username);
      console.log('     客户代码:', loginResult.data.data.customer_code);
      console.log('     客户名称:', loginResult.data.data.customer_name);
      console.log('     联系人:', loginResult.data.data.contact_person);
      console.log('     联系电话:', loginResult.data.data.contact_phone);
      console.log('     联系邮箱:', loginResult.data.data.contact_email);
      console.log('     公司地址:', loginResult.data.data.company_address);
    } else {
      console.log('❌ 登录失败！');
      console.log('   失败原因:', loginResult.data.msg);
      console.log('   返回数据:', JSON.stringify(loginResult.data, null, 2));
    }

    console.log();
    console.log('💡 提示：');
    console.log('   如果登录成功，请检查前端代码');
    console.log('   如果登录失败，请检查浏览器控制台错误');
    console.log('   如果有网络错误，请检查后端服务是否运行');

  } catch (err) {
    console.error('❌ 测试失败:', err.message);
    console.error('   错误详情:', err);
    
    if (err.code === 'ECONNREFUSED') {
      console.error('   ⚠️  后端服务未运行！');
      console.error('   请先启动后端服务：cd backend && node app.js');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('   ⚠️  请求超时！');
      console.error('   请检查网络连接');
    }
  }
}

testLogin123();
