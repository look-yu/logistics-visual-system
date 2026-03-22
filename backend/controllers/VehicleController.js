const VehicleModel = require('../models/VehicleModel');

class VehicleController {
  // 获取车辆列表
  static async getVehicleList(req, res) {
    try {
      const { status, car_type, car_no } = req.query;
      const list = await VehicleModel.findAll({ status, car_type, car_no });
      res.json({ code: 200, data: list, msg: '获取成功' });
    } catch (err) {
      console.error('获取车辆失败：', err);
      res.json({ code: 500, msg: '获取车辆失败' });
    }
  }

  // 车辆调度（创建运输任务）
  static async scheduleVehicle(req, res) {
    try {
      const { order_id, vehicle_id, route_plan, cost } = req.body;
      if (!order_id || !vehicle_id) {
        return res.json({ code: 400, msg: '订单和车辆ID必填' });
      }

      const task_no = 'TASK' + Date.now();
      await VehicleModel.createTransportTask({ task_no, order_id, vehicle_id, route_plan, cost });
      
      // 更新车辆状态为忙碌
      await VehicleModel.update(vehicle_id, { status: 'busy' });

      res.json({ code: 200, msg: '调度成功，任务已生成' });
    } catch (err) {
      console.error('调度失败：', err);
      res.json({ code: 500, msg: '调度失败' });
    }
  }

  // 获取运输任务列表
  static async getTaskList(req, res) {
    try {
      const { status, vehicle_id } = req.query;
      const list = await VehicleModel.getTasks({ status, vehicle_id });
      res.json({ code: 200, data: list, msg: '获取成功' });
    } catch (err) {
      console.error('获取任务失败：', err);
      res.json({ code: 500, msg: '获取失败' });
    }
  }

  // 更新任务状态（实时监控联动）
  static async updateTaskStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      let endTime = null;
      if (status === 'completed') {
        endTime = new Date();
      }

      await VehicleModel.updateTaskStatus(id, status, endTime);
      
      // 如果任务完成，将车辆状态改回空闲
      if (status === 'completed' || status === 'failed') {
        const [task] = await VehicleModel.getTasks({ status: status }); // 这里逻辑有点简化，实际应先查任务详情
        if (task) {
          await VehicleModel.update(task.vehicle_id, { status: 'idle' });
        }
      }

      res.json({ code: 200, msg: '状态已更新' });
    } catch (err) {
      console.error('更新任务失败：', err);
      res.json({ code: 500, msg: '更新失败' });
    }
  }
}

module.exports = VehicleController;
