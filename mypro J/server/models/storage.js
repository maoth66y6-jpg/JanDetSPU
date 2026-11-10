/**
 * SPU Canteen System - File Storage Model
 * จัดการการอ่านและบันทึกข้อมูล JSON Database บนเซิร์ฟเวอร์
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class StorageModel {
  static getFilePath(filename) {
    return path.join(DATA_DIR, filename.endsWith('.json') ? filename : `${filename}.json`);
  }

  static read(filename, fallback = null) {
    const filePath = StorageModel.getFilePath(filename);
    try {
      if (!fs.existsSync(filePath)) {
        if (fallback !== null) {
          StorageModel.write(filename, fallback);
        }
        return fallback;
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      console.warn(`[StorageModel] Error reading ${filename}:`, err.message);
      return fallback;
    }
  }

  static write(filename, data) {
    const filePath = StorageModel.getFilePath(filename);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (err) {
      console.error(`[StorageModel] Error writing ${filename}:`, err.message);
      return false;
    }
  }
}

module.exports = StorageModel;
