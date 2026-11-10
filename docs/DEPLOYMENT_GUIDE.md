# คู่มือการติดตั้งและรันระบบ (Deployment Guide) - จานเด็ด SPU 🚀

เอกสารนี้อธิบายวิธีการติดตั้ง รันระบบบน Localhost และแนวทางการนำขึ้นสู่เซิร์ฟเวอร์จริง (Production Deployment)

---

## วิธีที่ 1: รันผ่าน Localhost (แนะนำสำหรับการพรีเซนต์และทดสอบ)

### ความต้องการของระบบ (Prerequisites):
- ติดตั้ง **Node.js** (เวอร์ชัน 18 ขึ้นไป ตรวจสอบด้วยคำสั่ง `node -v`)

### ขั้นตอนการรัน:
1. **เปิดด้วย 1-Click Batch Script (ง่ายที่สุดบน Windows):**
   - ดับเบิลคลิกที่ไฟล์ **`start-server.bat`**
   - ตัวสคริปต์จะเริ่มรันเซิร์ฟเวอร์ที่พอร์ต `3000` และเปิดหน้าต่างเบราว์เซอร์ที่ `http://localhost:3000` ให้โดยอัตโนมัติ

2. **เปิดผ่าน Terminal / Command Line:**
   ```bash
   # ไปที่โฟลเดอร์โครงการ
   cd "c:\Users\maoth\Downloads\mypro J"

   # รันเซิร์ฟเวอร์
   node server.js
   ```
   หรือใช้คำสั่งผ่าน npm:
   ```bash
   npm start
   ```
   จากนั้นเปิดเว็บเบราว์เซอร์ไปที่:
   ```text
   http://localhost:3000
   ```

---

## วิธีที่ 2: รันแบบ Standalone โดยไม่ต้องใช้เซิร์ฟเวอร์ (Zero Setup)

หากเครื่องคอมพิวเตอร์ที่นำไปใช้งานไม่ได้ติดตั้ง Node.js หรือไม่มีสิทธิ์รัน Terminal:
- สามารถ **ดับเบิลคลิกที่ไฟล์ `index.html`** ได้ทันที
- ตัวระบบจะทำงานผ่าน `file:///` protocol โดยใช้ `localStorage` ในเบราว์เซอร์จำลองฟังก์ชันทุกอย่างได้สมบูรณ์ 100%

---

## วิธีที่ 3: การตั้งค่า Google Cloud Console OAuth 2.0 Client ID

หากต้องการทดสอบการล็อกอินด้วยบัญชี Google จริง:
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. สร้างโปรเจกต์ใหม่ > ไปที่ **APIs & Services** > **Credentials**
3. กด **+ Create Credentials** > เลือก **OAuth client ID**
4. เลือก Application Type เป็น **Web application**
5. ในช่อง **Authorized JavaScript origins** ให้เพิ่ม:
   - `http://localhost:3000`
   - `http://127.0.0.1:3000`
6. คัดลอก Client ID ที่ได้ (เช่น `123456789-abcdef.apps.googleusercontent.com`)
7. เข้าสู่ระบบแอดมิน (`admin@spu.ac.th`) > ไปที่แท็บ **⚙️ ตั้งค่า & รีเซ็ต** > วาง Client ID ในช่อง แล้วกด **"💾 บันทึก Google Client ID"**
