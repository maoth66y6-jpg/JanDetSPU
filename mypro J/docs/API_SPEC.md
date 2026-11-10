# ข้อมูลจำเพาะของ REST API (API Specification) - จานเด็ด SPU 📡

เอกสารนี้ระบุรายละเอียดของ Endpoint ทั้งหมดที่ให้บริการโดยเซิร์ฟเวอร์ Localhost (`http://localhost:3000/api`)

---

## 1. ข้อมูลระบบและสถิติ (System & Analytics)

### `GET /api/health`
ตรวจสอบสถานะการทำงานของเซิร์ฟเวอร์
- **Method:** `GET`
- **Response:** `200 OK`
```json
{
  "status": "ok",
  "uptime": 128.45,
  "timestamp": "2026-11-10T23:55:00.000Z"
}
```

---

### `GET /api/stats`
ดึงข้อมูลสถิติภาพรวม ยอดผู้เข้าชม และจำนวนข้อมูลในระบบ
- **Method:** `GET`
- **Response:** `200 OK`
```json
{
  "status": "success",
  "data": {
    "pageViews": 142,
    "uniqueVisitors": 58,
    "dailyVisits": {
      "2026-11-10": 142
    },
    "totalRestaurants": 0,
    "totalUsers": 1,
    "lastUpdated": "2026-11-10T23:55:00.000Z"
  }
}
```

---

### `POST /api/visitors/hit`
บันทึกการเข้าชมหน้าเว็บและนับจำนวนผู้เข้าชมแบบเรียลไทม์
- **Method:** `POST`
- **Request Body:**
```json
{
  "visitorUuid": "vis_1731254000_abc12",
  "isNewVisitor": false,
  "page": "/",
  "referrer": "direct"
}
```
- **Response:** `200 OK`
```json
{
  "status": "success",
  "pageViews": 143,
  "uniqueVisitors": 58
}
```

---

## 2. ผู้ใช้งานและผู้สมัครสมาชิก (Users & Applicants)

### `GET /api/users`
ดึงรายชื่อสมาชิกและข้อมูลผู้สมัครทั้งหมด (สำหรับแอดมิน)
- **Method:** `GET`
- **Response:** `200 OK`
```json
{
  "status": "success",
  "data": [
    {
      "id": "usr_admin",
      "name": "แอดมินจานเด็ด SPU",
      "studentId": "SPU-ADMIN-01",
      "faculty": "สำนักวิชาการและเทคโนโลยีสารสนเทศ",
      "phone": "02-579-1111",
      "email": "admin@spu.ac.th",
      "role": "admin",
      "userType": "อาจารย์/เจ้าหน้าที่",
      "status": "อนุมัติแล้ว",
      "checkInStreak": 7,
      "createdAt": "01 พ.ย. 2026"
    }
  ]
}
```

---

### `POST /api/users/register`
บันทึกข้อมูลการสมัครสมาชิกใหม่
- **Method:** `POST`
- **Request Body:**
```json
{
  "name": "สมชาย สายกิน",
  "studentId": "65012345",
  "faculty": "คณะเทคโนโลยีสารสนเทศ",
  "phone": "081-234-5678",
  "email": "somchai@spu.ac.th",
  "password": "password123",
  "userType": "นักศึกษา"
}
```
- **Response:** `201 Created`
```json
{
  "status": "success",
  "data": {
    "id": "usr_1731254000123",
    "name": "สมชาย สายกิน",
    "studentId": "65012345",
    "faculty": "คณะเทคโนโลยีสารสนเทศ",
    "role": "student",
    "userType": "นักศึกษา",
    "status": "อนุมัติแล้ว",
    "createdAt": "10 พ.ย. 2026"
  }
}
```

---

## 3. ข้อมูลร้านอาหาร (Restaurants & Canteen)

### `GET /api/restaurants`
ดึงรายการร้านอาหารทั้งหมดในมหาวิทยาลัยศรีปทุม
- **Method:** `GET`
- **Response:** `200 OK`
```json
{
  "status": "success",
  "data": []
}
```

---

### `POST /api/restaurants`
เพิ่มร้านอาหารใหม่ในโรงอาหาร SPU (เฉพาะแอดมิน)
- **Method:** `POST`
- **Request Body:**
```json
{
  "name": "ข้าวมันไก่ตอน สูตรโกฮับ",
  "location": "โรงเย็น อาคาร 10 (ชั้น 1)",
  "category": "ข้าวราดแกง / อาหารตามสั่ง",
  "priceRange": "45 - 55 บาท",
  "avgPrice": 50,
  "description": "ไก่ตอนเนื้อนุ่ม น้ำจิ้มเต้าเจี้ยวรสเด็ด น้ำซุปมะนาวดอง",
  "openHours": "08:00 - 16:30 น."
}
```
- **Response:** `201 Created`
