const db = require('./config/db');

/**
 * 自动签收定时任务
 * 每天执行一次，将超过5天且状态为"已送达"的订单自动签收
 */

async function autoSignOrders() {
  try {
    console.log('开始执行自动签收任务...');
    
    const sql = `
      UPDATE orders 
      SET 
        status = 'signed',
        signed_time = NOW(),
        signer = '系统自动签收',
        sign_remark = '超过5天未签收，系统自动签收'
      WHERE 
        status = 'delivered' 
        AND update_time < DATE_SUB(NOW(), INTERVAL 5 DAY)
        AND signed_time IS NULL
    `;
    
    const [result] = await db.query(sql);
    console.log(`自动签收任务完成，影响行数：${result.affectedRows}`);
    
    return result.affectedRows;
  } catch (error) {
    console.error('自动签收任务执行失败：', error);
    return 0;
  }
}

module.exports = {
  autoSignOrders
};

if (require.main === module) {
  autoSignOrders();
  process.exit(0);
}
