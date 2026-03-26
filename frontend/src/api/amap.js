import axios from 'axios'

const AMAP_KEY = 'd3381d894100dec0fe1e97eaf1689fff'

const amapRequest = axios.create({
  baseURL: 'https://restapi.amap.com',
  timeout: 10000
})

export const amapApi = {
  async getDrivingRoute(origin, destination) {
    try {
      const response = await amapRequest.get('/v3/direction/driving', {
        params: {
          key: AMAP_KEY,
          origin: `${origin.lng},${origin.lat}`,
          destination: `${destination.lng},${destination.lat}`,
          extensions: 'base',
          output: 'json'
        }
      })
      return response.data
    } catch (error) {
      console.error('高德地图API调用失败:', error)
      throw error
    }
  },

  async getRoutePlanning(origin, destination, waypoints = []) {
    try {
      const response = await amapRequest.get('/v3/direction/driving', {
        params: {
          key: AMAP_KEY,
          origin: `${origin.lng},${origin.lat}`,
          destination: `${destination.lng},${destination.lat}`,
          waypoints: waypoints.length > 0 ? waypoints.join('|') : undefined,
          extensions: 'all',
          output: 'json'
        }
      })
      return response.data
    } catch (error) {
      console.error('路线规划失败:', error)
      throw error
    }
  },

  async getDistance(origin, destination) {
    try {
      const response = await amapRequest.get('/v3/distance', {
        params: {
          key: AMAP_KEY,
          origins: `${origin.lng},${origin.lat}`,
          destination: `${destination.lng},${destination.lat}`,
          type: '1'
        }
      })
      return response.data
    } catch (error) {
      console.error('距离计算失败:', error)
      throw error
    }
  },

  async geocode(address) {
    try {
      const response = await amapRequest.get('/v3/geocode/geo', {
        params: {
          key: AMAP_KEY,
          address: address,
          output: 'json'
        }
      })
      return response.data
    } catch (error) {
      console.error('地址解析失败:', error)
      throw error
    }
  }
}

export default amapApi