/**
 * SPU Canteen System - Frontend Static & Integrity Test
 * ตรวจสอบความถูกต้องของไฟล์ HTML, CSS, JavaScript และตัวแปรระบบ
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 เริ่มต้นรัน Frontend Integrity Tests...');

const htmlPath = path.join(__dirname, '..', 'index.html');
const cssPath = path.join(__dirname, '..', 'css', 'style.css');
const appJsPath = path.join(__dirname, '..', 'js', 'app.js');
const dataJsPath = path.join(__dirname, '..', 'js', 'data.js');

assert(fs.existsSync(htmlPath), 'index.html does not exist');
assert(fs.existsSync(cssPath), 'style.css does not exist');
assert(fs.existsSync(appJsPath), 'app.js does not exist');
assert(fs.existsSync(dataJsPath), 'data.js does not exist');

const html = fs.readFileSync(htmlPath, 'utf8');
const appJs = fs.readFileSync(appJsPath, 'utf8');

// Check critical modals exist
const criticalModals = [
  'restaurantDetailModal',
  'authModal',
  'profileModal',
  'adminModal',
  'adminAccessModal',
  'restaurantFormModal',
  'googleConfigModal',
  'applicantDetailModal'
];

criticalModals.forEach(modalId => {
  assert(html.includes(`id="${modalId}"`), `Missing modal: ${modalId}`);
});
console.log('  ✅ Critical modals verified (' + criticalModals.length + ' modals)!');

// Check that Google Client ID status is NOT exposed in authModal
const authModalChunk = html.split('id="authModal"')[1].split('id="profileModal"')[0];
assert(!authModalChunk.includes('googleClientIdStatus'), 'googleClientIdStatus should not be in authModal');
console.log('  ✅ Google Client ID status is hidden from authModal!');

// Check visitor counter exists
assert(html.includes('id="publicVisitorCount"'), 'Missing publicVisitorCount element');
assert(html.includes('id="publicUniqueVisitorCount"'), 'Missing publicUniqueVisitorCount element');
console.log('  ✅ Visitor counter elements verified in footer!');

// Check 8-week rewards calendar in data.js
const dataJs = fs.readFileSync(dataJsPath, 'utf8');
assert(dataJs.includes('WEEKLY_REWARDS_CALENDAR'), 'Missing WEEKLY_REWARDS_CALENDAR');
assert(dataJs.includes('frame-grand-emperor'), 'Missing frame-grand-emperor (Week 8)');
assert(dataJs.includes('frame-none'), 'Missing base frame frame-none');
console.log('  ✅ 8-Week / 2-Month Rewards Calendar & Base Frame verified!');

// Check logo image file and integration
const logoPath = path.join(__dirname, '..', 'assets', 'images', 'spu-chef-logo.png');
assert(fs.existsSync(logoPath), 'spu-chef-logo.png does not exist');
assert(html.includes('assets/images/spu-chef-logo.png'), 'Logo image not linked in index.html');
console.log('  ✅ SPU Chef Mascot Logo image verified and linked!');

// Check local file upload and 5-images manager in restaurant modal
assert(html.includes('id="rstImageFile"'), 'Missing local image file input in restaurant form');
assert(html.includes('id="rstImageFilesInput"'), 'Missing multi-file input in restaurant form');
assert(html.includes('id="rstFormImagesGrid"'), 'Missing 5-images grid in restaurant form');
assert(appJs.includes('handleRestaurantMultiFileUpload'), 'Missing handleRestaurantMultiFileUpload in app.js');
assert(appJs.includes('handleRestaurantImageFileUpload'), 'Missing handleRestaurantImageFileUpload in app.js');
console.log('  ✅ Admin 5-Images Restaurant Gallery Manager verified!');

// Check Fullscreen Photo Lightbox Modal
assert(html.includes('id="imageLightboxModal"'), 'Missing imageLightboxModal in index.html');
assert(appJs.includes('openPhotoLightbox'), 'Missing openPhotoLightbox in app.js');
console.log('  ✅ Fullscreen Photo Lightbox & Review Photo Viewer verified!');

// Check admin full reward privileges
assert(appJs.includes('grantAdminFullRewards'), 'Missing grantAdminFullRewards in app.js');
console.log('  ✅ Admin Full Rewards Instant Access privilege verified!');

// Check Daily Check-In Header and Roadmap Removal
assert(!appJs.includes('roadmap-container'), 'Roadmap container should be removed from app.js');
assert(appJs.includes('🗓️ ตารางล็อกอินสะสมรายวัน'), 'Check-in title should be 🗓️ ตารางล็อกอินสะสมรายวัน');
console.log('  ✅ Daily Check-in Title & Roadmap cleanup verified!');

// Check Empty State separation for Admin vs General Visitors
assert(appJs.includes('ตอนนี้ยังไม่มีร้านแนะนำ ลองมาใหม่ในรอบหน้านะครับ'), 'Missing visitor empty state text');
assert(appJs.includes('ยังไม่มีร้านอาหารในระบบ (กล่องว่างพร้อมให้ใส่ข้อมูล)'), 'Missing admin empty state text');
console.log('  ✅ Visitor vs Admin Empty State separation verified!');

// Check Google Client ID in Admin panel
assert(html.includes('id="googleClientIdStatus"'), 'googleClientIdStatus should be present in Admin panel');
console.log('  ✅ Google Client ID status relocated to Admin panel!');

console.log('\n🎉 ทุกการทดสอบ Frontend ผ่านฉลุย 100%!');
