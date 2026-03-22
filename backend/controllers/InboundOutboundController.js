const InboundOutboundModel = require('../models/InboundOutboundModel');

class InboundOutboundController {
  static async getRecordList(req, res) {
    try {
      const { page = 1, size = 10, record_type, status, record_no } = req.query;
      const list = await InboundOutboundModel.findAll({ page, size, record_type, status, record_no });
      const total = await InboundOutboundModel.count({ record_type, status, record_no });
      
      res.json({
        code: 200,
        data: { list, total },
        msg: '获取成功'
      });
    } catch (err) {
      console.error('获取出入库记录列表失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }

  static async getRecordDetail(req, res) {
    try {
      const { id } = req.params;
      const record = await InboundOutboundModel.findById(id);
      
      if (!record) {
        return res.json({ code: 404, msg: '记录不存在' });
      }
      
      res.json({
        code: 200,
        data: record,
        msg: '获取成功'
      });
    } catch (err) {
      console.error('获取出入库记录详情失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }

  static async createRecord(req, res) {
    try {
      const recordData = req.body;
      const id = await InboundOutboundModel.create(recordData);
      
      res.json({
        code: 200,
        data: { id },
        msg: '创建成功'
      });
    } catch (err) {
      console.error('创建出入库记录失败：', err);
      res.json({ code: 500, msg: '创建失败' });
    }
  }

  static async updateRecord(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const affectedRows = await InboundOutboundModel.update(id, updateData);
      
      if (affectedRows === 0) {
        return res.json({ code: 404, msg: '记录不存在' });
      }
      
      res.json({
        code: 200,
        msg: '更新成功'
      });
    } catch (err) {
      console.error('更新出入库记录失败：', err);
      res.json({ code: 500, msg: '更新失败' });
    }
  }

  static async deleteRecord(req, res) {
    try {
      const { id } = req.params;
      const affectedRows = await InboundOutboundModel.delete(id);
      
      if (affectedRows === 0) {
        return res.json({ code: 404, msg: '记录不存在' });
      }
      
      res.json({
        code: 200,
        msg: '删除成功'
      });
    } catch (err) {
      console.error('删除出入库记录失败：', err);
      res.json({ code: 500, msg: '删除失败' });
    }
  }

  static async getStatistics(req, res) {
    try {
      const statistics = await InboundOutboundModel.getStatistics();
      
      res.json({
        code: 200,
        data: statistics,
        msg: '获取成功'
      });
    } catch (err) {
      console.error('获取出入库统计失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }
}

module.exports = InboundOutboundController;
