/**
 * SPU Canteen System - Backend Automated Integration Tests
 * ตรวจสอบความถูกต้องของ REST APIs และการบันทึกข้อมูล
 */

const assert = require('assert');
const StorageModel = require('../server/models/storage');
const AnalyticsController = require('../server/controllers/analyticsController');
const UserController = require('../server/controllers/userController');
const RestaurantController = require('../server/controllers/restaurantController');

console.log('🧪 เริ่มต้นรัน Backend Integration Tests...');

// 1. StorageModel Test
console.log('  Testing StorageModel...');
StorageModel.write('test_file', { hello: 'world' });
const readBack = StorageModel.read('test_file');
assert.strictEqual(readBack.hello, 'world', 'StorageModel read/write failed');
console.log('  ✅ StorageModel passed!');

// 2. AnalyticsController Test
console.log('  Testing AnalyticsController...');
const hitRes = AnalyticsController.recordHit({ isNewVisitor: true, page: '/test' });
assert.strictEqual(hitRes.status, 'success', 'recordHit failed');
assert(hitRes.pageViews >= 1, 'pageViews should be at least 1');
console.log('  ✅ AnalyticsController passed! (pageViews: ' + hitRes.pageViews + ')');

// 3. UserController Test
console.log('  Testing UserController...');
const testEmail = `test_${Date.now()}@spu.ac.th`;
const regRes = UserController.register({
  name: 'นักศึกษาทดสอบ',
  studentId: '65099999',
  faculty: 'คณะเทคโนโลยีสารสนเทศ',
  email: testEmail,
  password: 'password123',
  userType: 'นักศึกษา'
});
assert.strictEqual(regRes.status, 'success', 'User registration failed');
assert.strictEqual(regRes.data.studentId, '65099999');

// Test cleanup
UserController.deleteUser(regRes.data.id);
console.log('  ✅ UserController passed!');

// 4. RestaurantController Test
console.log('  Testing RestaurantController...');
const rstRes = RestaurantController.create({
  name: 'ร้านทดสอบโรงเย็น',
  location: 'โรงเย็น อาคาร 10 (ชั้น 1)',
  avgPrice: 45
});
assert.strictEqual(rstRes.status, 'success');
assert.strictEqual(rstRes.data.name, 'ร้านทดสอบโรงเย็น');

// Test cleanup
RestaurantController.delete(rstRes.data.id);
console.log('  ✅ RestaurantController passed!');

console.log('\n🎉 ทุกการทดสอบ Backend ผ่านฉลุย 100%!');
