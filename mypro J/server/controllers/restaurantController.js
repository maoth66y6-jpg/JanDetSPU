/**
 * SPU Canteen System - Restaurant Controller
 * จัดการข้อมูลร้านอาหารและเมนูในโรงอาหาร SPU
 */

const StorageModel = require('../models/storage');

class RestaurantController {
  static getAll() {
    return StorageModel.read('restaurants', []);
  }

  static getById(id) {
    const list = RestaurantController.getAll();
    return list.find(r => r.id === id) || null;
  }

  static create(data) {
    const list = RestaurantController.getAll();
    const newRst = {
      id: data.id || `rst_${Date.now()}`,
      name: data.name || 'ร้านอาหารใหม่ใน SPU',
      location: data.location || 'โรงเย็น อาคาร 10 (ชั้น 1)',
      category: data.category || 'ข้าวราดแกง / อาหารตามสั่ง',
      priceRange: data.priceRange || '40 - 60 บาท',
      avgPrice: Number(data.avgPrice) || 50,
      rating: 5.0,
      reviewCount: 0,
      image: data.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      description: data.description || '',
      openHours: data.openHours || '08:00 - 17:00 น.',
      tags: Array.isArray(data.tags) ? data.tags : [],
      menus: Array.isArray(data.menus) ? data.menus : [
        { name: "เมนูซิกเนเจอร์จานเด็ด", price: Number(data.avgPrice) || 50, isRecommended: true }
      ]
    };

    list.unshift(newRst);
    StorageModel.write('restaurants', list);
    return { status: 'success', data: newRst };
  }

  static update(id, updates) {
    const list = RestaurantController.getAll();
    const idx = list.findIndex(r => r.id === id);
    if (idx === -1) {
      return { status: 'error', message: 'ไม่พบร้านอาหารที่ต้องการแก้ไข' };
    }

    list[idx] = { ...list[idx], ...updates };
    StorageModel.write('restaurants', list);
    return { status: 'success', data: list[idx] };
  }

  static delete(id) {
    const list = RestaurantController.getAll();
    const updated = list.filter(r => r.id !== id);
    StorageModel.write('restaurants', updated);
    return { status: 'success', message: 'ลบร้านอาหารเรียบร้อยแล้ว' };
  }
}

module.exports = RestaurantController;
