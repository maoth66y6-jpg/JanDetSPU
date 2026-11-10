/**
 * SPU Canteen System - REST API Router
 * กำหนดเส้นทาง RESTful API ทั้งหมดของระบบหลังบ้าน
 */

const AnalyticsController = require('../controllers/analyticsController');
const UserController = require('../controllers/userController');
const RestaurantController = require('../controllers/restaurantController');
const StorageModel = require('../models/storage');

function handleApiRequest(req, res, pathname, query, body) {
  // Common CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return true;
  }

  // 1. Health check
  if (pathname === '/api/health' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() }));
    return true;
  }

  // 2. Stats & Analytics
  if (pathname === '/api/stats' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify(AnalyticsController.getStats(req, res)));
    return true;
  }

  if (pathname === '/api/visitors/hit' && req.method === 'POST') {
    res.statusCode = 200;
    res.end(JSON.stringify(AnalyticsController.recordHit(body)));
    return true;
  }

  // 3. Users & Applicants
  if (pathname === '/api/users' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'success', data: UserController.getUsers() }));
    return true;
  }

  if (pathname === '/api/users/register' && req.method === 'POST') {
    const result = UserController.register(body);
    res.statusCode = result.status === 'success' ? 201 : 400;
    res.end(JSON.stringify(result));
    return true;
  }

  // 4. Restaurants
  if (pathname === '/api/restaurants' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'success', data: RestaurantController.getAll() }));
    return true;
  }

  if (pathname === '/api/restaurants' && req.method === 'POST') {
    const result = RestaurantController.create(body);
    res.statusCode = 201;
    res.end(JSON.stringify(result));
    return true;
  }

  // 5. Settings
  if (pathname === '/api/settings' && req.method === 'GET') {
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'success', data: StorageModel.read('settings', {}) }));
    return true;
  }

  if (pathname === '/api/settings' && req.method === 'PUT') {
    StorageModel.write('settings', body);
    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'success', data: body }));
    return true;
  }

  return false;
}

module.exports = { handleApiRequest };
