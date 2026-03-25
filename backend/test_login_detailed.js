const http = require('http');
const crypto = require('crypto');

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

async function testLoginIssues() {
  console.log('=== 测试登录问题 ===\n');

  try {
    console.log('1️⃣  测试已注册用户登录');
    console.log('   用户名: 123');
    console.log('   密码: 123456');
    
    const loginResult = await makeRequest('/api/auth/login', 'POST', {
      username: '123',
      password: '123456'
    });

    console.log('   响应状态:', loginResult.status);
    console.log('   响应数据:', JSON.stringify(loginResult.data, null, 2));
    console.log();

    if (loginResult.data.code === 200) {
      console.log('   ✅ 登录成功！');
      console.log('   客户ID:', loginResult.data.data.id);
      console.log('   用户名:', loginResult.data.data.username);
    } else {
      console.log('   ❌ 登录失败：', loginResult.data.msg);
    }

    console.log();
    console.log('2️⃣  测试错误的密码');
    console.log('   用户名: 123');
    console.log('   密码: wrongpassword');
    
    const wrongPasswordResult = await makeRequest('/api/auth/login', 'POST', {
      username: '123',
      password: 'wrongpassword'
    });

    console.log('   响应状态:', wrongPasswordResult.status);
    console.log('   响应数据:', JSON.stringify(wrongPasswordResult.data, null, 2));
    console.log();

    if (wrongPasswordResult.data.code === 200) {
      console.log('   ⚠️  错误的密码竟然登录成功了！');
    } else {
      console.log('   ✅ 正确拒绝了错误的密码');
    }

    console.log();
    console.log('3️⃣  测试不存在的用户');
    console.log('   用户名: nonexistentuser');
    console.log('   密码: 123456');
    
    const nonexistentResult = await makeRequest('/api/auth/login', 'POST', {
      username: 'nonexistentuser',
      password: '123456'
    });

    console.log('   响应状态:', nonexistentResult.status);
    console.log('   响应数据:', JSON.stringify(nonexistentResult.data, null, 2));
    console.log();

    if (nonexistentResult.data.code === 200) {
      console.log('   ⚠️  不存在的用户竟然登录成功了！');
    } else {
      console.log('   ✅ 正确拒绝了不存在的用户');
    }

    console.log();
    console.log('4️⃣  验证密码哈希');
    const password = '123456';
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    console.log('   原始密码:', password);
    console.log('   哈希密码:', hashedPassword);
    console.log('   数据库中的密码前缀:', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'.substring(0, 20));
    console.log('   是否匹配:', hashedPassword.substring(0, 20) === '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'.substring(0, 20));

    console.log();
    console.log('=== ✅ 测试完成 ===');

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

testLoginIssues();
