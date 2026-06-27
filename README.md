# KeyRush — ระบบฝึกพิมพ์คำสั่ง (Interactive Terminal Training)

KeyRush เป็นเว็บแอปพลิเคชันสำหรับฝึกใช้งานคำสั่ง Command Line ของระบบปฏิบัติการ Linux และ Windows ผ่านรูปแบบเกมภารกิจ ผู้ใช้สามารถเลือกด่าน ฝึกพิมพ์คำสั่ง เก็บ EXP เพิ่ม Level ดูสถิติการเล่น และแข่งขันคะแนนผ่าน Leaderboard ได้

โปรเจกต์นี้แบ่งออกเป็น 2 repository หลัก ได้แก่

- `keyrush-frontend` — ส่วนหน้าเว็บ พัฒนาด้วย Next.js, React, TypeScript และ Tailwind CSS
- `keyrush-backend` — ส่วน API Server พัฒนาด้วย Node.js, Express.js, TypeScript, Prisma และ PostgreSQL

ระบบถูกออกแบบเป็น Stateless REST API เพื่อให้โครงสร้างเบา เข้าใจง่าย และเหมาะสำหรับการขยายระบบในอนาคต

---

## ภาพรวมและจุดประสงค์

| หัวข้อ | รายละเอียด |
|---|---|
| ประเภทระบบ | Interactive Terminal Training Platform |
| ผู้ใช้หลัก | ผู้เล่นทั่วไป, ผู้ดูแลระบบ |
| จุดประสงค์ | ฝึกใช้คำสั่ง Terminal / Command Line ผ่านเกมภารกิจ |
| ระบบปฏิบัติการที่รองรับ | Linux และ Windows |
| การยืนยันตัวตน | JWT Bearer Token และ Google OAuth |
| ฐานข้อมูล | PostgreSQL |
| ORM | Prisma |
| รูปแบบ API | REST API |

Workflow หลักของระบบ:

```txt
เลือก OS → เลือกด่าน → อ่านโจทย์ → พิมพ์คำสั่ง → ตรวจคำตอบ → บันทึก EXP/Level → แสดงผลบน Dashboard/Leaderboard
```

---

## เทคโนโลยีที่ใช้

### Frontend (`keyrush-frontend/`)

| เทคโนโลยี | รายละเอียด |
|---|---|
| Next.js | React Framework สำหรับสร้างเว็บแอปและจัดการ Routing |
| React | ใช้สร้าง UI Components |
| TypeScript | เพิ่มความปลอดภัยของชนิดข้อมูล |
| Tailwind CSS | ใช้จัดการ Styling |
| Framer Motion | ใช้ทำ Animation และ UI Interaction |
| Axios / Fetch API | ใช้เรียก REST API จาก Backend |
| Google OAuth | ใช้สำหรับ Login ผ่าน Google |
| LocalStorage | ใช้เก็บ JWT Token และข้อมูลผู้ใช้ฝั่ง Client |

หน้าที่ของ Frontend:

```txt
- แสดง UI ให้ผู้ใช้ใช้งาน
- รับ input เช่น username, password, command
- เรียก API ไปยัง backend
- แสดงข้อมูล Mission, Progress, Documents, Leaderboard
- เก็บ token และ user data ไว้ใน localStorage
- จัดการ routing เช่น /dashboard, /campaign, /documents, /leaderboard
```

---

### Backend (`keyrush-backend/`)

| เทคโนโลยี | รายละเอียด |
|---|---|
| Node.js | Runtime สำหรับรัน JavaScript/TypeScript ฝั่ง Server |
| Express.js | Web API Framework |
| TypeScript | ใช้เพิ่ม type safety ให้ backend |
| Prisma ORM | ใช้ติดต่อฐานข้อมูลและจัดการ schema |
| PostgreSQL | ฐานข้อมูลหลัก |
| JWT | ใช้สำหรับ Authentication |
| bcrypt | ใช้ hash password ก่อนบันทึกลงฐานข้อมูล |
| Nodemailer | ใช้ส่งอีเมลยืนยันบัญชีและกู้รหัสผ่าน |
| dotenv | ใช้โหลด Environment Variables |
| CORS | เปิดให้ frontend เรียก API ได้ |

หน้าที่ของ Backend:

```txt
- รับ request จาก frontend
- ตรวจสอบข้อมูลและสิทธิ์ของผู้ใช้
- จัดการ Authentication และ Authorization
- Query / Create / Update / Delete ข้อมูลผ่าน Prisma
- ส่ง response กลับเป็น JSON
- จัดการ business logic เช่น Mission, Progress, Leaderboard, Documents
```

---

## สถาปัตยกรรมระบบ

### Request Flow

```txt
Browser / Client
    │
    ▼
Next.js Frontend : http://localhost:3000
    │
    │  HTTP Request / Fetch / Axios
    ▼
Express.js Backend : http://localhost:5000
    │
    │  Prisma ORM
    ▼
PostgreSQL Database : localhost:5432
```

### Layer การทำงาน

```txt
Presentation Layer
- Next.js / React UI

API Layer
- Express.js REST API

Business Logic Layer
- Auth, Mission, Progress, Leaderboard, Documents, Admin CMS

Data Access Layer
- Prisma ORM

Database Layer
- PostgreSQL
```

---

## ฟีเจอร์หลักตามบทบาท

### User / Player

| ฟีเจอร์ | รายละเอียด |
|---|---|
| Register / Login | สมัครสมาชิกและเข้าสู่ระบบ |
| Google Login | เข้าสู่ระบบผ่านบัญชี Google |
| Email Verification | ยืนยันอีเมลก่อนเข้าใช้งาน |
| Forgot Password | ขอรีเซ็ตรหัสผ่านผ่านอีเมล |
| Campaign Mode | เล่นด่านฝึกคำสั่ง Linux / Windows |
| Progress Tracking | เก็บ Level และ EXP แยกตาม OS |
| Dashboard | ดูสถิติส่วนตัว เช่น WPM, Accuracy |
| Documents | อ่านคำอธิบายคำสั่งจากข้อมูล Mission |
| Leaderboard | ดูอันดับผู้เล่นตาม EXP |
| Profile | ดูและแก้ไขข้อมูลส่วนตัว |
| Public Profile | ดูโปรไฟล์ผู้เล่นคนอื่น |

### Admin

| ฟีเจอร์ | รายละเอียด |
|---|---|
| Mission Management | เพิ่ม แก้ไข ลบ Mission |
| Admin Authorization | ตรวจสอบ role ก่อนเข้าใช้งาน API |
| Favorite Mission | กดบันทึก Mission ที่สนใจ |
| Databank | ดูคำตอบและข้อมูลโจทย์ทั้งหมด |

---

## Use Case หลักของระบบ

### UC-01: สมัครสมาชิก

**Actor:** ผู้ใช้ใหม่

**Flow:**

```txt
1. ผู้ใช้กรอก username, email, password และ displayName
2. Frontend ส่ง POST /api/auth/register
3. Backend validate ข้อมูล
4. Backend ตรวจ username/email ซ้ำ
5. Backend hash password ด้วย bcrypt
6. Backend สร้าง verifyToken
7. Backend บันทึก user ลง database
8. Backend ส่งอีเมลยืนยันบัญชี
```

**ผลลัพธ์:** ผู้ใช้มีบัญชีในระบบและต้องยืนยันอีเมลก่อน Login

---

### UC-02: Login

**Actor:** ผู้ใช้ที่มีบัญชี

**Flow:**

```txt
1. ผู้ใช้กรอก username และ password
2. Frontend ส่ง POST /api/auth/login
3. Backend ค้นหา user จาก database
4. Backend ตรวจ password ด้วย bcrypt.compare
5. Backend ตรวจว่า email verified แล้วหรือยัง
6. Backend สร้าง JWT Token
7. Frontend เก็บ token และ user data ลง localStorage
```

**ผลลัพธ์:** ผู้ใช้เข้าสู่ระบบสำเร็จและสามารถใช้งานระบบได้

---

### UC-03: เล่น Mission

**Actor:** ผู้ใช้ที่เข้าสู่ระบบแล้ว

**Flow:**

```txt
1. ผู้ใช้เลือก OS เช่น linux หรือ windows
2. Frontend เรียก GET /api/mission/:os/:level
3. Backend query mission จาก database
4. Frontend แสดงโจทย์
5. ผู้ใช้พิมพ์ command
6. Frontend ตรวจคำสั่งกับ expectedCommand
7. ถ้าถูกต้อง Frontend ส่ง PUT /api/user/progress
8. Backend update Level, EXP และ PlayHistory
```

**ผลลัพธ์:** ผู้ใช้ผ่านด่าน ได้รับ EXP และระบบบันทึกความก้าวหน้า

---

### UC-04: ดู Documents

**Actor:** ผู้ใช้ทั่วไปหรือผู้ใช้ที่ Login แล้ว

**Flow:**

```txt
1. ผู้ใช้เข้า /documents
2. Frontend เรียก GET /api/docs/commands
3. Backend query ตาราง Mission
4. Backend map Mission เป็น Command Document
5. Frontend แสดง command, syntax, example, description และ rewardExp
```

**ผลลัพธ์:** ผู้ใช้สามารถอ่านคำอธิบายคำสั่งจากข้อมูลจริงใน database

---

### UC-05: ดู Leaderboard

**Actor:** ผู้ใช้ทั่วไปหรือผู้ใช้ที่ Login แล้ว

**Flow:**

```txt
1. ผู้ใช้เปิดหน้า Leaderboard
2. Frontend เรียก GET /api/leaderboard/:os
3. Backend query user ที่มี EXP
4. Backend sort ตาม EXP
5. Frontend แสดงอันดับผู้เล่น
```

**ผลลัพธ์:** ผู้ใช้เห็นอันดับผู้เล่นแยก Linux, Windows หรือ Combined

---

### UC-06: Admin จัดการ Mission

**Actor:** Admin

**Flow:**

```txt
1. Admin login
2. Frontend ส่ง request ไปยัง /api/admin/missions
3. Backend ตรวจ JWT Token
4. Backend ตรวจ role ว่าเป็น admin หรือไม่
5. Admin สามารถเพิ่ม แก้ไข หรือลบ mission ได้
```

**ผลลัพธ์:** ข้อมูล Mission ใน database ถูกจัดการผ่านหน้า Admin CMS

---

## Test Case หลักของระบบ

### TC-AUTH-001: Register สำเร็จ

| หัวข้อ | รายละเอียด |
|---|---|
| Feature | Register |
| Precondition | username และ email ยังไม่ซ้ำ |
| Steps | กรอกข้อมูลสมัครสมาชิกและกด Register |
| Expected Result | สร้าง user สำเร็จ, password ถูก hash, ส่งอีเมลยืนยัน |

---

### TC-AUTH-002: Login ด้วย Password ผิด

| หัวข้อ | รายละเอียด |
|---|---|
| Feature | Login |
| Steps | กรอก username ถูกต้อง แต่ password ผิด |
| Expected Result | ระบบไม่ให้ login และไม่สร้าง JWT token |

---

### TC-MISSION-001: โหลด Mission สำเร็จ

| หัวข้อ | รายละเอียด |
|---|---|
| Feature | Mission |
| Steps | เรียก `GET /api/mission/linux/1` |
| Expected Result | Backend ส่งข้อมูล mission กลับมา |

---

### TC-MISSION-002: พิมพ์คำสั่งถูกต้อง

| หัวข้อ | รายละเอียด |
|---|---|
| Feature | Command Validation |
| Steps | พิมพ์ command ตรงกับ expectedCommand |
| Expected Result | ผ่านด่าน และบันทึก progress |

---

### TC-MISSION-003: พิมพ์คำสั่งผิด

| หัวข้อ | รายละเอียด |
|---|---|
| Feature | Command Validation |
| Steps | พิมพ์ command ไม่ตรงกับ expectedCommand |
| Expected Result | ไม่ผ่านด่าน และไม่เพิ่ม EXP |

---

### TC-PROGRESS-001: บันทึก Progress Linux

| หัวข้อ | รายละเอียด |
|---|---|
| Feature | Save Progress |
| Steps | ส่ง `PUT /api/user/progress` พร้อม `os=linux` |
| Expected Result | update `linuxLevel` และ `linuxExp` |

---

### TC-DOCS-001: โหลด Documents สำเร็จ

| หัวข้อ | รายละเอียด |
|---|---|
| Feature | Documents |
| Steps | เปิดหน้า `/documents` |
| Expected Result | แสดงข้อมูลคำสั่งจาก Mission database |

---

### TC-ADMIN-001: User ธรรมดาเข้า Admin API

| หัวข้อ | รายละเอียด |
|---|---|
| Feature | Admin Authorization |
| Steps | user role ปกติเรียก `/api/admin/missions` |
| Expected Result | ระบบส่ง `403 Access Denied` |

---

## โครงสร้างโปรเจกต์

### Frontend

```txt
keyrush-frontend/
├── app/
│   ├── dashboard/
│   ├── campaign/
│   ├── documents/
│   ├── leaderboard/
│   ├── profile/
│   ├── login/
│   └── ...
├── components/
│   ├── Navbar.tsx
│   └── ...
├── public/
├── package.json
├── next.config.ts
└── tsconfig.json
```

### Backend

```txt
keyrush-backend/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── routes/
│   └── app.ts
├── server.ts
├── package.json
├── .env.example
└── tsconfig.json
```

---

## ฐานข้อมูลหลัก

### User

ใช้เก็บข้อมูลผู้ใช้และความก้าวหน้า

```txt
id
username
email
password
displayName
avatar
bio
role
isEmailVerified
verifyToken
resetToken
resetTokenExpiry
linuxLevel
linuxExp
windowsLevel
windowsExp
adminFavorites
createdAt
```

### Mission

ใช้เก็บข้อมูลด่าน

```txt
id
os
difficulty
level
title
description
expectedCommand
hint
rewardExp
```

### PlayHistory

ใช้เก็บประวัติการเล่นและสถิติ

```txt
id
userId
os
level
wpm
accuracy
createdAt
```

---

## API Endpoints

### Authentication

| Method | Endpoint | รายละเอียด |
|---|---|---|
| POST | `/api/auth/register` | สมัครสมาชิก |
| POST | `/api/auth/login` | เข้าสู่ระบบ |
| POST | `/api/auth/google` | Login ด้วย Google |
| GET | `/api/auth/verify` | ยืนยันอีเมล |
| POST | `/api/auth/resend-verification` | ส่งอีเมลยืนยันซ้ำ |
| POST | `/api/auth/forgot-password` | ขอรีเซ็ตรหัสผ่าน |
| POST | `/api/auth/reset-password` | ตั้งรหัสผ่านใหม่ |

### User

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/user/progress` | ดึงข้อมูลผู้ใช้และ progress |
| PUT | `/api/user/progress` | บันทึก progress |
| GET | `/api/user/stats` | ดึงค่า WPM และ Accuracy |
| PUT | `/api/user/profile` | แก้ไข profile |
| GET | `/api/users/profile/:username` | ดู public profile |

### Mission

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/mission/all` | ดึง mission ทั้งหมด |
| GET | `/api/mission/:os/:level` | ดึง mission ตาม OS และ Level |

### Documents

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/docs/commands` | ดึงข้อมูลคำสั่งจาก Mission ไปแสดงหน้า Documents |

### Leaderboard

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/leaderboard/:os` | ดึงอันดับผู้เล่นตาม Linux, Windows หรือ Combined |

### Admin

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/admin/missions` | ดึง mission ทั้งหมด |
| POST | `/api/admin/missions` | สร้าง mission ใหม่ |
| PUT | `/api/admin/missions/:id` | แก้ไข mission |
| DELETE | `/api/admin/missions/:id` | ลบ mission |
| PUT | `/api/admin/favorites` | toggle favorite mission |

---

## ความต้องการของระบบ

| รายการ | เวอร์ชันที่แนะนำ |
|---|---|
| Node.js | 18.x หรือ 20.x ขึ้นไป |
| npm | มาพร้อม Node.js |
| PostgreSQL | 14.x ขึ้นไป |
| Git | เวอร์ชันล่าสุด |
| Prisma CLI | ติดตั้งผ่าน dependency ของ backend |

---

## วิธีเริ่มต้นใช้งาน

### 1. Clone Repository

```bash
git clone https://github.com/Reversenb/keyrush-frontend.git
git clone https://github.com/Reversenb/keyrush-backend.git
```

---

### 2. ตั้งค่า Backend

```bash
cd keyrush-backend
npm install
```

สร้างไฟล์ `.env` จาก `.env.example`

```env
PORT=5000
DATABASE_URL="postgresql://<user>:<password>@localhost:5432/keyrush?schema=public"
JWT_SECRET="your_jwt_secret_key"
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password"
```

รัน Prisma และ seed ข้อมูล

```bash
npx prisma db push
npx prisma db seed
```

รัน backend

```bash
npm run dev
```

Backend จะรันที่

```txt
http://localhost:5000
```

---

### 3. ตั้งค่า Frontend

```bash
cd keyrush-frontend
npm install
```

สร้างไฟล์ `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

รัน frontend

```bash
npm run dev
```

Frontend จะรันที่

```txt
http://localhost:3000
```

---

## บัญชีทดสอบ

| Username / Email | Role | หมายเหตุ |
|---|---|---|
| `admin@keyrush.local` | Admin | ใช้ทดสอบหน้า Admin CMS |
| `player1@keyrush.local` | User | ใช้ทดสอบระบบผู้เล่นทั่วไป |

> หมายเหตุ: บัญชีทดสอบขึ้นอยู่กับข้อมูลใน seed script ของ backend

---

## คำสั่งที่ใช้บ่อย

### Backend

```bash
npm run dev
npm run build
npm start
npx prisma db push
npx prisma db seed
npx prisma studio
```

### Frontend

```bash
npm run dev
npm run build
npm start
npm run lint
```

---

## ข้อจำกัดของระบบ

| หัวข้อ | รายละเอียด |
|---|---|
| Command Validation | ยังตรวจคำสั่งโดยเทียบกับ `expectedCommand` เป็นหลัก |
| Analytics | บาง metric ยังต้องเพิ่มระบบ log เช่น retention, retry count |
| Email Service | ใช้ Nodemailer เหมาะกับระบบตัวอย่าง ยังไม่ใช่ queue-based email |
| Connection Pool | หาก deploy production ควรตั้งค่า connection pooling |
| Multi-Tenant | ระบบยังเป็นฐานข้อมูลกลาง ไม่รองรับแยกองค์กร |
| Realtime PvP | เวอร์ชันปัจจุบันเน้น Stateless REST API และถอด PvP ออกเพื่อให้ระบบเบาขึ้น |

---



---

## สรุป

KeyRush เป็นเว็บแอปสำหรับฝึกใช้คำสั่ง Terminal และ Command Line ผ่านรูปแบบภารกิจ โดยมีระบบผู้ใช้ ระบบยืนยันตัวตน ระบบด่านฝึกซ้อม ระบบเก็บ EXP และ Level ระบบสถิติ ระบบเอกสารคำสั่ง ระบบจัดอันดับ และระบบ Admin CMS

Frontend ทำหน้าที่เป็นส่วนติดต่อผู้ใช้และเรียกใช้งาน API  
Backend ทำหน้าที่เป็น REST API Server และจัดการ Business Logic  
Database ใช้เก็บข้อมูลผู้ใช้ Mission และสถิติการเล่น  
Prisma ทำหน้าที่เป็นตัวกลางระหว่าง Backend และ PostgreSQL

โปรเจกต์นี้แสดงให้เห็นการทำงานครบตั้งแต่ Frontend, Backend, Database, Authentication, Authorization, API Design และ Data-driven UI
