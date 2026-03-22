const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'logistics_db',
  port: 3306,
  charset: 'utf8mb4'
};

async function exportSchema() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 已连接到数据库');

    const fs = require('fs');
    const path = require('path');

    let sqlContent = '';
    sqlContent += '-- ========================================\n';
    sqlContent += '-- 数据库表结构导出\n';
    sqlContent += '-- 数据库：logistics_db\n';
    sqlContent += '-- 导出时间：' + new Date().toLocaleString('zh-CN') + '\n';
    sqlContent += '-- ========================================\n\n';

    sqlContent += 'DROP DATABASE IF EXISTS logistics_db;\n';
    sqlContent += 'CREATE DATABASE IF NOT EXISTS logistics_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;\n';
    sqlContent += 'USE logistics_db;\n\n';

    const [tables] = await connection.query("SHOW TABLES");

    for (const table of tables) {
      const tableName = Object.values(table)[0];
      console.log(`正在导出表：${tableName}`);

      sqlContent += `-- ========================================\n`;
      sqlContent += `-- 表名：${tableName}\n`;
      sqlContent += `-- ========================================\n`;

      const [createTable] = await connection.query(`SHOW CREATE TABLE ${tableName}`);
      sqlContent += createTable[0]['Create Table'] + ';\n\n';

      const [columns] = await connection.query(`DESCRIBE ${tableName}`);
      sqlContent += `-- 字段信息：\n`;
      columns.forEach(col => {
        sqlContent += `--   ${col.Field} | ${col.Type} | ${col.Null} | ${col.Key} | ${col.Default}\n`;
      });
      sqlContent += '\n';
    }

    const outputPath = path.join(__dirname, 'database_schema.sql');
    fs.writeFileSync(outputPath, sqlContent, 'utf8');

    console.log('\n✅ 表结构导出成功！');
    console.log(`📁 文件路径：${outputPath}`);
    console.log(`📊 共导出 ${tables.length} 个表`);

  } catch (error) {
    console.error('❌ 导出失败：', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

exportSchema();
