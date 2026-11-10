@echo off
chcp 65001 >nul
title จานเด็ด SPU - Localhost Server (Port 3000)
color 0F
cls
echo ========================================================================
echo   🍛 จานเด็ด SPU (Sripatum University Best Dishes & Canteen Review)
echo   🚀 กำลังเริ่มต้นเซิร์ฟเวอร์ Localhost...
echo ========================================================================
echo.
echo กำลังเปิดเบราว์เซอร์ที่ http://localhost:3000 ...
start http://localhost:3000
echo.
echo [SERVER STATUS] กำลังรัน Node.js เซิร์ฟเวอร์...
echo (กดปิดหน้าต่างนี้ หรือกด Ctrl+C เพื่อหยุดเซิร์ฟเวอร์)
echo.
node server.js
pause
