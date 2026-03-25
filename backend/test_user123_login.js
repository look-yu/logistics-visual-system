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

async function testUser123Login() {
  console.log('=== 测试用户 123 登录 ===\n');

  const username = '123';
  const password = '123456';

  console.log('1️⃣  计算密码哈希');
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
  console.log('   用户名:', username);
  console.log('   密码:', password);
  console.log('   哈希密码:', hashedPassword);
  console.log('   哈希长度:', hashedPassword.length);
  console.log();

  console.log('2️⃣  查询数据库中的密码');
  console.log('   数据库中的密码前缀:', '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'.substring(0, 30));
  console.log('   计算的哈希前缀:', hashedPassword.substring(0, 30));
  console.log('   是否匹配:', hashedPassword.substring(0, 30) === '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92'.substring(0, 30));
  console.log();

  console.log('3️⃣  发送登录请求');
  try {
    const loginResult = await makeRequest('/api/auth/login', 'POST', {
      username: username,
      password: password
    });

    console.log('   响应状态:', loginResult.status);
    console.log('   响应代码:', loginResult.data.code);
    console.log('   响应消息:', loginResult.data.msg);
    
    if (loginResult.data.code === 200) {
      console.log('   ✅ 登录成功！');
      console.log('   返回的客户数据:');
      console.log('     ID:', loginResult.data.data.id);
      console.log('     用户名:', loginResult.data.data.username);
      console.log('     客户名称:', loginResult.data.data.customer_name);
    } else {
      console.log('   ❌ 登录失败！');
      console.log('   失败原因:', loginResult.data.msg);
    }
  } catch (err) {
    console.error('   ❌ 请求失败:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('   错误：后端服务未运行');
    } else if (err.code === 'ETIMEDOUT') {
      console.error('   错误：请求超时');
    }
  }

  console.log();
  console.log('4️⃣  检查后端日志');
  console.log('   请查看后端终端的日志输出');
  console.log('   如果有错误信息，请提供给我');
}

testUser123Login();
