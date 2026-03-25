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

async function testExistingUserLogin() {
  console.log('=== 测试已注册用户登录 ===\n');

  try {
    console.log('1️⃣  查询数据库中的用户');
    console.log('   查询条件: username LIKE "testuser%"');
    console.log();

    console.log('2️⃣  尝试登录第一个用户');
    console.log('   用户名: testuser1774321021248');
    console.log('   密码: test123456');
    
    const loginResult = await makeRequest('/api/auth/login', 'POST', {
      username: 'testuser1774321021248',
      password: 'test123456'
    });

    console.log('   响应状态:', loginResult.status);
    console.log('   响应数据:', JSON.stringify(loginResult.data, null, 2));
    console.log();

    if (loginResult.data.code === 200) {
      console.log('   ✅ 登录成功！');
    } else {
      console.log('   ❌ 登录失败：', loginResult.data.msg);
    }

    console.log();
    console.log('3️⃣  尝试登录第二个用户');
    console.log('   用户名: 123');
    console.log('   密码: 123456');
    
    const loginResult2 = await makeRequest('/api/auth/login', 'POST', {
      username: '123',
      password: '123456'
    });

    console.log('   响应状态:', loginResult2.status);
    console.log('   响应数据:', JSON.stringify(loginResult2.data, null, 2));
    console.log();

    if (loginResult2.data.code === 200) {
      console.log('   ✅ 登录成功！');
    } else {
      console.log('   ❌ 登录失败：', loginResult2.data.msg);
    }

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

testExistingUserLogin();
