/**
 * SPU Canteen System - User & Applicant Controller
 * จัดการข้อมูลสมาชิกและผู้สมัคร
 */

const StorageModel = require('../models/storage');

class UserController {
  static getUsers() {
    return StorageModel.read('users', []);
  }

  static getUserById(id) {
    const users = UserController.getUsers();
    return users.find(u => u.id === id) || null;
  }

  static register(userData) {
    const users = UserController.getUsers();
    const emailLower = (userData.email || '').toLowerCase().trim();

    const existing = users.find(u => u.email.toLowerCase() === emailLower);
    if (existing) {
      return { status: 'error', message: 'อีเมลนี้ถูกใช้งานแล้วในระบบ' };
    }

    const newUser = {
      id: userData.id || `usr_${Date.now()}`,
      name: userData.name || 'สมาชิกใหม่ SPU',
      studentId: userData.studentId || (userData.userType === 'นักศึกษา' ? '67' + Math.floor(100000 + Math.random() * 900000) : 'SPU-MB-01'),
      faculty: userData.faculty || 'คณะเทคโนโลยีสารสนเทศ',
      phone: userData.phone || '-',
      email: emailLower,
      password: userData.password || '',
      role: emailLower.includes('admin') ? 'admin' : 'student',
      userType: userData.userType || 'นักศึกษา',
      status: 'อนุมัติแล้ว',
      applicationNotes: userData.applicationNotes || 'สมัครผ่านระบบเว็บไซต์',
      avatar: userData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      badges: userData.badges || ['newbie'],
      favorites: userData.favorites || [],
      checkInStreak: userData.checkInStreak || 0,
      lastCheckInDate: userData.lastCheckInDate || null,
      unlockedFrames: userData.unlockedFrames || ['frame-none'],
      equippedFrame: userData.equippedFrame || 'frame-none',
      customTitle: userData.customTitle || 'นักชิมมือใหม่',
      unlockedTitles: userData.unlockedTitles || ['นักชิมมือใหม่'],
      createdAt: userData.createdAt || new Date().toLocaleDateString('th-TH')
    };

    users.push(newUser);
    StorageModel.write('users', users);

    return { status: 'success', data: newUser };
  }

  static updateUser(id, updates) {
    const users = UserController.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) {
      return { status: 'error', message: 'ไม่พบผู้ใช้ที่ระบุ' };
    }

    users[idx] = { ...users[idx], ...updates };
    StorageModel.write('users', users);
    return { status: 'success', data: users[idx] };
  }

  static deleteUser(id) {
    const users = UserController.getUsers();
    const updated = users.filter(u => u.id !== id);
    StorageModel.write('users', updated);
    return { status: 'success', message: 'ลบบัญชีผู้ใช้เรียบร้อย' };
  }
}

module.exports = UserController;
