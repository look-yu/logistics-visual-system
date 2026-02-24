const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// ========== 1. 全局配置（保留所有原有配置） ==========
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', 
    "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;" +
    "connect-src * 'self' data: blob:;" +
    "img-src * 'self' data: blob:;" +
    "script-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;" +
    "style-src * 'self' 'unsafe-inline' data: blob:;"
  );
  next();
});
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => {
  res.status(200).json({});
});

// ========== 2. 挂载路由（核心，仅这一行） ==========
const visualRoutes = require('./routes/visualRoutes');
app.use('/api', visualRoutes);

// ========== 3. 健康检查 + 启动服务（保留） ==========
app.get('/health', (req, res) => {
  res.json({ code: 200, msg: "后端正常运行" });
});
app.listen(PORT, () => {
  console.log(`✅ 后端启动成功：http://localhost:${PORT}`);
  console.log(`✅ 接口测试：http://localhost:${PORT}/api/get_role_data?role=manager`);
  console.log(`✅ 新增接口测试：http://localhost:${PORT}/api/dispatcher/capacity`);
});