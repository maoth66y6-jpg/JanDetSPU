/**
 * จานเด็ด SPU - ข้อมูลเริ่มต้นของระบบ (Initial Configurations)
 * รองรับการทำงานแบบ Standalone เปิด index.html ผ่านบราวเซอร์ได้ทันที
 */

const DEFAULT_SETTINGS = {
  siteName: "จานเด็ด SPU",
  tagline: "รวมร้านเด็ด รีวิวโดนใจ แก้ปัญหาเที่ยงนี้กินอะไรดี ณ มหาวิทยาลัยศรีปทุม",
  heroSubtitle: "ระบบค้นหา แนะนำร้านอาหาร รีวิวจากเด็ก SPU ตัวจริง พร้อมวงล้อสุ่มเมนูและระบบล็อกอินรายสัปดาห์สะสมฉายาและกรอบโปรไฟล์",
  announcementTicker: "📢 ยินดีต้อนรับสู่ 'จานเด็ด SPU' เพื่อนคู่คิดมื้อเที่ยงของเด็กศรีปทุม! ล็อกอินต่อเนื่องครบ 7 วัน รับรางวัลใหญ่ประจำสัปดาห์ 🍗✨",
  activeTheme: "spu-classic", // spu-classic, loy-krathong, halloween, christmas, songkran, chinese-new-year
  festivalBannerText: "🎓 สัปดาห์เปิดเทอม SPU: โชว์บัตรนักศึกษา รับส่วนลดพิเศษจากร้านค้าในโรงเย็น อาคาร 10 และโรงร้อนหลังอาคาร 5!",
  festivalBannerActive: true,
  googleClientId: "" // Google Cloud Console OAuth 2.0 Web Client ID
};

const THEMES = {
  "spu-classic": {
    id: "spu-classic",
    name: "SPU Classic (ชมพู-ดำ ศรีปทุม)",
    icon: "💖",
    primary: "#f43f5e",
    primaryDark: "#be123c",
    secondary: "#18181b",
    accent: "#fb7185",
    bgGradient: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
    headerBg: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
    cardBg: "#ffffff",
    cardBorder: "#f43f5e",
    badgeBg: "#ffe4e6",
    badgeColor: "#be123c",
    particleEmoji: "💖",
    bannerBg: "linear-gradient(90deg, #f43f5e, #18181b)"
  },
  "loy-krathong": {
    id: "loy-krathong",
    name: "เทศกาลลอยกระทง (Loy Krathong)",
    icon: "🪷",
    primary: "#6366f1",
    primaryDark: "#4338ca",
    secondary: "#fbbf24",
    accent: "#38bdf8",
    bgGradient: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    headerBg: "linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)",
    cardBg: "#ffffff",
    cardBorder: "#6366f1",
    badgeBg: "#e0e7ff",
    badgeColor: "#3730a3",
    particleEmoji: "🪷",
    bannerBg: "linear-gradient(90deg, #3730a3, #4338ca)"
  },
  "halloween": {
    id: "halloween",
    name: "เทศกาลฮาโลวีน (Halloween Party)",
    icon: "🎃",
    primary: "#ea580c",
    primaryDark: "#c2410c",
    secondary: "#7e22ce",
    accent: "#84cc16",
    bgGradient: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)",
    headerBg: "linear-gradient(135deg, #7c2d12 0%, #3b0764 100%)",
    cardBg: "#ffffff",
    cardBorder: "#ea580c",
    badgeBg: "#ffedd5",
    badgeColor: "#9a3412",
    particleEmoji: "🎃",
    bannerBg: "linear-gradient(90deg, #9a3412, #581c87)"
  },
  "christmas": {
    id: "christmas",
    name: "เทศกาลคริสต์มาส & ปีใหม่ (Christmas)",
    icon: "🎄",
    primary: "#dc2626",
    primaryDark: "#991b1b",
    secondary: "#16a34a",
    accent: "#eab308",
    bgGradient: "linear-gradient(135deg, #f0fdf4 0%, #fef2f2 100%)",
    headerBg: "linear-gradient(135deg, #991b1b 0%, #166534 100%)",
    cardBg: "#ffffff",
    cardBorder: "#dc2626",
    badgeBg: "#fee2e2",
    badgeColor: "#b91c1c",
    particleEmoji: "❄️",
    bannerBg: "linear-gradient(90deg, #dc2626, #16a34a)"
  },
  "songkran": {
    id: "songkran",
    name: "เทศกาลสงกรานต์ (Songkran Festival)",
    icon: "💦",
    primary: "#0284c7",
    primaryDark: "#0369a1",
    secondary: "#f59e0b",
    accent: "#06b6d4",
    bgGradient: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
    headerBg: "linear-gradient(135deg, #0369a1 0%, #0e7490 100%)",
    cardBg: "#ffffff",
    cardBorder: "#0284c7",
    badgeBg: "#e0f2fe",
    badgeColor: "#0369a1",
    particleEmoji: "💦",
    bannerBg: "linear-gradient(90deg, #0284c7, #06b6d4)"
  },
  "chinese-new-year": {
    id: "chinese-new-year",
    name: "เทศกาลตรุษจีน (Chinese New Year)",
    icon: "🧧",
    primary: "#b91c1c",
    primaryDark: "#7f1d1d",
    secondary: "#d97706",
    accent: "#f59e0b",
    bgGradient: "linear-gradient(135deg, #fff1f2 0%, #fef3c7 100%)",
    headerBg: "linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)",
    cardBg: "#ffffff",
    cardBorder: "#b91c1c",
    badgeBg: "#fee2e2",
    badgeColor: "#991b1b",
    particleEmoji: "🧧",
    bannerBg: "linear-gradient(90deg, #991b1b, #b91c1c)"
  }
};

/**
 * โรงอาหารในมหาวิทยาลัยศรีปทุม (SPU):
 * 1. โรงเย็น อาคาร 10 มี 3 ชั้น
 * 2. โรงร้อน มีชั้นเดียว หลังอาคาร 5
 */
const SPU_LOCATIONS = [
  "โรงเย็น อาคาร 10 (ชั้น 1)",
  "โรงเย็น อาคาร 10 (ชั้น 2)",
  "โรงเย็น อาคาร 10 (ชั้น 3)",
  "โรงร้อน (หลังอาคาร 5)"
];

const FOOD_CATEGORIES = [
  "ข้าวราดแกง / อาหารตามสั่ง",
  "ก๋วยเตี๋ยว / บะหมี่ / ราเมน",
  "เบอร์เกอร์ / สเต็ก / ฟาสต์ฟู้ด",
  "เครื่องดื่ม / กาแฟสด / ชานมไข่มุก",
  "ของหวาน / เบเกอรี่ / วาฟเฟิล",
  "ส้มตำ / ยำแซ่บ / อาหารอีสาน",
  "อาหารเพื่อสุขภาพ / มังสวิรัติ"
];

const BADGES_LIST = [
  { id: "newbie", name: "นักชิมมือใหม่", icon: "🌱", desc: "เริ่มต้นเป็นสมาชิกชุมชนจานเด็ด SPU", reqType: "register" },
  { id: "canteen_hero", name: "ฮีโร่โรงอาหาร", icon: "🏆", desc: "ล็อกอินต่อเนื่องสะสมครบ 7 วัน", reqType: "streak", minStreak: 7 },
  { id: "street_master", name: "เซียนรีวิวอาหาร", icon: "🔥", desc: "เขียนรีวิวร้านอาหารในมอครบ 2 ร้าน", reqType: "reviews", minReviews: 2 },
  { id: "spu_gourmet", name: "SPU Food Master", icon: "👑", desc: "กูรูอาหารระดับตำนาน เขียนรีวิวครบ 4 ร้าน", reqType: "reviews", minReviews: 4 }
];

const PROFILE_FRAMES = [
  { id: "frame-none", name: "ธรรมดา (กรอบพื้นฐาน)", icon: "⚪", desc: "กรอบปกติมาตรฐานสำหรับสมาชิกใหม่", unlockDesc: "มีทันทีเมื่อสมัคร" },
  { id: "frame-cyberpunk", name: "Cyberpunk Pink-Black", icon: "⚡", desc: "กรอบนีออนล้ำยุคชมพูดำสุดเท่ SPU", unlockDesc: "รางวัลสตรีค สัปดาห์ที่ 1 (ครบ 7 วัน)" },
  { id: "frame-crystal-blue", name: "Crystal Blue Canteen", icon: "❄️", desc: "กรอบคริสตัลนีออนบลู โรงเย็น อาคาร 10", unlockDesc: "รางวัลสตรีค สัปดาห์ที่ 2 (ครบ 14 วัน)" },
  { id: "frame-volcano-fire", name: "Volcano Fire Canteen", icon: "🔥", desc: "กรอบเปลวเพลิงภูเขาไฟ โรงร้อนหลังตึก 5", unlockDesc: "รางวัลสตรีค สัปดาห์ที่ 3 (ครบ 21 วัน)" },
  { id: "frame-emerald-legend", name: "Emerald SPU Legend", icon: "💎", desc: "กรอบมรกตหยกเขียวประกายเพชร ฉลองครบ 1 เดือน", unlockDesc: "รางวัลสตรีค สัปดาห์ที่ 4 (ครบ 28 วัน / 1 เดือน)" },
  { id: "frame-cosmic-galaxy", name: "Cosmic Galaxy Violet", icon: "🌌", desc: "กรอบม่วงกาแล็กซีแสงออโรร่าล้ำอนาคต", unlockDesc: "รางวัลสตรีค สัปดาห์ที่ 5 (ครบ 35 วัน)" },
  { id: "frame-pastel-rainbow", name: "Sweet Pastel Rainbow", icon: "🌈", desc: "กรอบสายรุ้งพาสเทลหวานละมุนสายคาเฟ่", unlockDesc: "รางวัลสตรีค สัปดาห์ที่ 6 (ครบ 42 วัน)" },
  { id: "frame-platinum-knight", name: "Platinum Diamond Knight", icon: "⚔️", desc: "กรอบแพลตตินัมเงินบริสุทธิ์ประกายเพชร", unlockDesc: "รางวัลสตรีค สัปดาห์ที่ 7 (ครบ 49 วัน)" },
  { id: "frame-grand-emperor", name: "Grand Golden Emperor", icon: "👑", desc: "กรอบทองคำจักรพรรดิออร่าสุริยะ ฉลองครบ 2 เดือน!", unlockDesc: "รางวัลสตรีค สัปดาห์ที่ 8 (ครบ 56 วัน / 2 เดือน)" },
  { id: "frame-spu-pink", name: "SPU Pink Neon", icon: "💖", desc: "กรอบนีออนชมพูสุดจี๊ด SPU", unlockDesc: "เขียนรีวิวร้านแรก" },
  { id: "frame-flame", name: "Flame Food Master", icon: "🍖", desc: "กรอบเปลวไฟนักชิมตัวยง", unlockDesc: "เขียนรีวิวครบ 2 ร้าน" },
  { id: "frame-gold", name: "Golden Foodie", icon: "⭐", desc: "กรอบทองคำเปล่งประกาย", unlockDesc: "เขียนรีวิวครบ 3 ร้าน" }
];

/**
 * ปฏิทินของรางวัลล็อกอินสะสม 8 สัปดาห์ (ครอบคลุมระยะเวลา 2 เดือนเต็ม)
 * แต่ละสัปดาห์วันที่ 7 จะได้รับกรอบโปรไฟล์และฉายาที่ไม่ซ้ำกันเลย!
 */
const WEEKLY_REWARDS_CALENDAR = [
  {
    week: 1,
    dayTarget: 7,
    weekName: "สัปดาห์ที่ 1: ก้าวแรกสู่วงการจานเด็ด",
    frameId: "frame-cyberpunk",
    frameName: "กรอบ Cyberpunk Pink-Black",
    frameIcon: "⚡",
    title: "สุดยอดนักชิม 7 วัน SPU",
    badgeId: "canteen_hero",
    desc: "กรอบนีออนชมพู-ฟ้าไซเบอร์พังก์ SPU พร้อมฉายานักชิม 7 วัน",
    color: "#06b6d4"
  },
  {
    week: 2,
    dayTarget: 14,
    weekName: "สัปดาห์ที่ 2: จอมยุทธ์โรงเย็น อาคาร 10",
    frameId: "frame-crystal-blue",
    frameName: "กรอบ Crystal Blue Canteen",
    frameIcon: "❄️",
    title: "จอมยุทธ์โรงเย็น อาคาร 10",
    badgeId: "canteen_hero_w2",
    desc: "กรอบคริสตัลนีออนบลูเปล่งประกายความสดชื่นแห่งโรงเย็น อาคาร 10",
    color: "#0284c7"
  },
  {
    week: 3,
    dayTarget: 21,
    weekName: "สัปดาห์ที่ 3: ขุนพลกระทะร้อนหลังตึก 5",
    frameId: "frame-volcano-fire",
    frameName: "กรอบ Volcano Fire Canteen",
    frameIcon: "🔥",
    title: "ราชันย์กระทะร้อนหลังอาคาร 5",
    badgeId: "canteen_hero_w3",
    desc: "กรอบเปลวเพลิงภูเขาไฟสุดดุดันแห่งโรงร้อนหลังอาคาร 5",
    color: "#dc2626"
  },
  {
    week: 4,
    dayTarget: 28,
    weekName: "สัปดาห์ที่ 4: ฉลองครบ 1 เดือนเต็ม!",
    frameId: "frame-emerald-legend",
    frameName: "กรอบ Emerald SPU Legend",
    frameIcon: "💎",
    title: "เซียนจานเด็ดศรีปทุม 1 เดือน",
    badgeId: "canteen_hero_w4",
    desc: "กรอบมรกตหยกเขียวประกายเพชร ฉลองความภักดีครบ 1 เดือน",
    color: "#059669"
  },
  {
    week: 5,
    dayTarget: 35,
    weekName: "สัปดาห์ที่ 5: ท่องอวกาศสายกิน",
    frameId: "frame-cosmic-galaxy",
    frameName: "กรอบ Cosmic Galaxy Violet",
    frameIcon: "🌌",
    title: "นักชิมทะลุมิติจักรวาล SPU",
    badgeId: "canteen_hero_w5",
    desc: "กรอบม่วงกาแล็กซีแสงออโรร่าล้ำอนาคต",
    color: "#8b5cf6"
  },
  {
    week: 6,
    dayTarget: 42,
    weekName: "สัปดาห์ที่ 6: กูรูของหวานและคาเฟ่",
    frameId: "frame-pastel-rainbow",
    frameName: "กรอบ Sweet Pastel Rainbow",
    frameIcon: "🌈",
    title: "กูรูคาเฟ่ & ของหวานตัวแม่ SPU",
    badgeId: "canteen_hero_w6",
    desc: "กรอบสายรุ้งพาสเทลหวานละมุนสำหรับสายคาเฟ่ขนมหวาน",
    color: "#f472b6"
  },
  {
    week: 7,
    dayTarget: 49,
    weekName: "สัปดาห์ที่ 7: อัศวินนักล่าจานเด็ด",
    frameId: "frame-platinum-knight",
    frameName: "กรอบ Platinum Diamond Knight",
    frameIcon: "⚔️",
    title: "อัศวินนักล่าจานเด็ดระดับพรีเมียม",
    badgeId: "canteen_hero_w7",
    desc: "กรอบแพลตตินัมเงินบริสุทธิ์ประกายเพชรอัศวิน",
    color: "#94a3b8"
  },
  {
    week: 8,
    dayTarget: 56,
    weekName: "สัปดาห์ที่ 8: มหาเทพจานเด็ด ครบ 2 เดือนเต็ม!",
    frameId: "frame-grand-emperor",
    frameName: "กรอบ Grand Golden Emperor",
    frameIcon: "👑",
    title: "มหาเทพจานเด็ด SPU 60 วัน",
    badgeId: "canteen_hero_w8",
    desc: "กรอบทองคำจักรพรรดิออร่าสุริยะ สูงสุดในปฐพี SPU ครบ 60 วัน",
    color: "#eab308"
  }
];

/**
 * บัญชีผู้ดูแลระบบตั้งต้น (ไม่มีบัญชีทดลองอื่น ผู้ใช้สามารถสมัครหรือเข้าด้วย Google Cloud Console ได้เอง)
 */
const INITIAL_USERS = [
  {
    id: "usr_admin",
    name: "แอดมินจานเด็ด SPU",
    studentId: "SPU-ADMIN-01",
    faculty: "สำนักวิชาการและเทคโนโลยีสารสนเทศ",
    phone: "02-579-1111",
    email: "admin@spu.ac.th",
    password: "password123",
    role: "admin",
    userType: "อาจารย์/เจ้าหน้าที่",
    status: "อนุมัติแล้ว",
    applicationNotes: "ผู้ดูแลระบบหลัก (Super Admin) ดูแลระบบร้านอาหารและผู้สมัคร",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    badges: ["newbie", "canteen_hero"],
    favorites: [],
    checkInStreak: 7,
    lastCheckInDate: null,
    unlockedFrames: [
      "frame-none",
      "frame-cyberpunk",
      "frame-crystal-blue",
      "frame-volcano-fire",
      "frame-emerald-legend",
      "frame-cosmic-galaxy",
      "frame-pastel-rainbow",
      "frame-platinum-knight",
      "frame-grand-emperor",
      "frame-spu-pink",
      "frame-gold",
      "frame-flame"
    ],
    equippedFrame: "frame-grand-emperor",
    customTitle: "มหาเทพจานเด็ด SPU 60 วัน",
    unlockedTitles: [
      "นักชิมมือใหม่",
      "SPU Food Master",
      "สุดยอดนักชิม 7 วัน SPU",
      "จอมยุทธ์โรงเย็น อาคาร 10",
      "ราชันย์กระทะร้อนหลังอาคาร 5",
      "เซียนจานเด็ดศรีปทุม 1 เดือน",
      "นักชิมทะลุมิติจักรวาล SPU",
      "กูรูคาเฟ่ & ของหวานตัวแม่ SPU",
      "อัศวินนักล่าจานเด็ดระดับพรีเมียม",
      "มหาเทพจานเด็ด SPU 60 วัน"
    ],
    createdAt: "01 พ.ย. 2026"
  }
];

/**
 * รายการร้านอาหารเริ่มต้น: เริ่มต้นเป็นกล่องเปล่าตามคำขอ เพื่อให้ผู้ใช้สามารถใส่ข้อมูลร้านอาหารด้วยตนเอง
 */
const INITIAL_RESTAURANTS = [];

/**
 * รายการรีวิวเริ่มต้น: ว่างเปล่า
 */
const INITIAL_REVIEWS = [];

/**
 * ข่าวสารและโปรโมชั่นเริ่มต้น
 */
const INITIAL_NEWS = [
  {
    id: "news_1",
    title: "🎉 ยินดีต้อนรับสู่ 'จานเด็ด SPU' ระบบค้นหาและรีวิวอาหารในมหาวิทยาลัย",
    tag: "ข่าวสารมหาลัย",
    content: "พบกับระบบรีวิวอาหารและวงล้อสุ่มมื้ออาหาร พร้อมระบบล็อกอินสะสมสตรีค 7 วันเพื่อรับรางวัลใหญ่ประจำสัปดาห์!",
    date: "01 พ.ย. 2026",
    active: true,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80"
  }
];
