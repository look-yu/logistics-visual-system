const TransportQueueModel = require('../models/TransportQueueModel');

class TransportQueueController {
  static async getQueueList(req, res) {
    try {
      const { page = 1, size = 10, status, priority, queue_no } = req.query;
      const list = await TransportQueueModel.findAll({ page, size, status, priority, queue_no });
      const total = await TransportQueueModel.count({ status, priority, queue_no });
      
      res.json({
        code: 200,
        data: { list, total },
        msg: '获取成功'
      });
    } catch (err) {
      console.error('获取运输队列列表失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }

  static async getQueueDetail(req, res) {
    try {
      const { id } = req.params;
      const queue = await TransportQueueModel.findById(id);
      
      if (!queue) {
        return res.json({ code: 404, msg: '队列项不存在' });
      }
      
      res.json({
        code: 200,
        data: queue,
        msg: '获取成功'
      });
    } catch (err) {
      console.error('获取运输队列详情失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }

  static async createQueue(req, res) {
    try {
      const queueData = req.body;
      const id = await TransportQueueModel.create(queueData);
      
      res.json({
        code: 200,
        data: { id },
        msg: '创建成功'
      });
    } catch (err) {
      console.error('创建运输队列失败：', err);
      res.json({ code: 500, msg: '创建失败' });
    }
  }

  static async updateQueue(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const affectedRows = await TransportQueueModel.update(id, updateData);
      
      if (affectedRows === 0) {
        return res.json({ code: 404, msg: '队列项不存在' });
      }
      
      res.json({
        code: 200,
        msg: '更新成功'
      });
    } catch (err) {
      console.error('更新运输队列失败：', err);
      res.json({ code: 500, msg: '更新失败' });
    }
  }

  static async deleteQueue(req, res) {
    try {
      const { id } = req.params;
      const affectedRows = await TransportQueueModel.delete(id);
      
      if (affectedRows === 0) {
        return res.json({ code: 404, msg: '队列项不存在' });
      }
      
      res.json({
        code: 200,
        msg: '删除成功'
      });
    } catch (err) {
      console.error('删除运输队列失败：', err);
      res.json({ code: 500, msg: '删除失败' });
    }
  }

  static async getStatistics(req, res) {
    try {
      const statistics = await TransportQueueModel.getStatistics();
      
      res.json({
        code: 200,
        data: statistics,
        msg: '获取成功'
      });
    } catch (err) {
      console.error('获取运输队列统计失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }
}

module.exports = TransportQueueController;
