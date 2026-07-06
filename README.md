# KeyRush — ระบบฝึกพิมพ์คำสั่ง (Interactive Terminal Training)

KeyRush เป็นเว็บแอปพลิเคชันสำหรับฝึกใช้งานคำสั่ง Command Line ของระบบปฏิบัติการ Linux และ Windows ผ่านรูปแบบเกมภารกิจ ผู้ใช้สามารถเลือกด่าน ฝึกพิมพ์คำสั่ง เก็บ EXP เพิ่ม Level ดูสถิติการเล่น และแข่งขันคะแนนผ่าน Leaderboard ได้

โปรเจกต์นี้แบ่งออกเป็น 2 repository หลัก ได้แก่

- **keyrush-frontend** — ส่วนหน้าเว็บ พัฒนาด้วย Next.js, React, TypeScript และ Tailwind CSS
- **keyrush-backend** — ส่วน API Server พัฒนาด้วย Hono, Cloudflare Workers, TypeScript, Prisma และ Cloudflare D1 (SQLite)

ระบบถูกออกแบบเป็น Serverless REST API เพื่อให้โครงสร้างเบา ประมวลผลได้รวดเร็วบน Edge Network ทั่วโลก เข้าใจง่าย และรองรับผู้ใช้งานจำนวนมากได้โดยไม่ต้องกังวลเรื่องการจัดการเซิร์ฟเวอร์

---

## สารบัญ

- [ภาพรวมและจุดประสงค์](#ภาพรวมและจุดประสงค์)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [สถาปัตยกรรมระบบ](#สถาปัตยกรรมระบบ)
- [ฟีเจอร์หลักตามบทบาท](#ฟีเจอร์หลักตามบทบาท)
- [Use Case หลักของระบบ](#use-case-หลักของระบบ)
- [Test Case หลักของระบบ](#test-case-หลักของระบบ)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ฐานข้อมูลหลัก](#ฐานข้อมูลหลัก)
- [API Endpoints](#api-endpoints)
- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [วิธีเริ่มต้นใช้งาน (Local Development)](#วิธีเริ่มต้นใช้งาน-local-development)
- [บัญชีทดสอบ](#บัญชีทดสอบ)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
- [ข้อจำกัดของระบบ](#ข้อจำกัดของระบบ)
- [สรุป](#สรุป)

---

## ภาพรวมและจุดประสงค์

| หัวข้อ | รายละเอียด |
|---|---|
| ประเภทระบบ | Interactive Terminal Training Platform |
| ผู้ใช้หลัก | ผู้เล่นทั่วไป, ผู้ดูแลระบบ |
| จุดประสงค์ | ฝึกใช้คำสั่ง Terminal / Command Line ผ่านเกมภารกิจ |
| ระบบปฏิบัติการที่รองรับ | Linux และ Windows |
| การยืนยันตัวตน | JWT Bearer Token และ Google OAuth (Client-side Token Flow) |
| ฐานข้อมูล | Cloudflare D1 (Serverless SQLite) |
| ORM | Prisma (พร้อม `@prisma/adapter-d1`) |
| รูปแบบ API | Serverless REST API |

**Workflow หลักของระบบ:**

```
เลือก OS → เลือกด่าน → อ่านโจทย์ → พิมพ์คำสั่ง → ตรวจคำตอบ → บันทึก EXP/Level → แสดงผลบน Dashboard/Leaderboard
```

---

## เทคโนโลยีที่ใช้

### Frontend (`keyrush-frontend/`)

| เทคโนโลยี | รายละเอียด |
|---|---|
| Next.js | React Framework สำหรับสร้างเว็บแอปและจัดการ Routing |
| React | ใช้สร้าง UI Components (ผสาน Event Listeners สำหรับจับ Keystroke) |
| TypeScript | เพิ่มความปลอดภัยของชนิดข้อมูล |
| Tailwind CSS | ใช้จัดการ Styling สไตล์ Modern & Glassmorphism |
| Framer Motion | ใช้ทำ Animation และ UI Interaction ให้สมูท |
| Axios / Fetch API | ใช้เรียก REST API จาก Backend |
| Google OAuth | ใช้สำหรับ Login ผ่าน Google (`@react-oauth/google`) |
| LocalStorage | ใช้เก็บ JWT Token และข้อมูลผู้ใช้ฝั่ง Client |

**หน้าที่ของ Frontend:**

```
- แสดง UI ให้ผู้ใช้ใช้งาน (Gamified Terminal)
- จับ Event การพิมพ์ (Keystrokes) คำนวณ WPM และ Accuracy แบบ Real-time
- รับ input เช่น username, password, command
- เรียก API ไปยัง backend
- แสดงข้อมูล Mission, Progress, Documents, Leaderboard
- เก็บ token และ user data ไว้ใน localStorage
- จัดการ routing เช่น /dashboard, /campaign, /documents, /leaderboard
```

### Backend (`keyrush-backend/`)

| เทคโนโลยี | รายละเอียด |
|---|---|
| Cloudflare Workers | Runtime สำหรับรันโค้ดฝั่ง Server แบบ Serverless บน Edge Network |
| Hono | Web API Framework สุดเบาและเร็ว ออกแบบมาเพื่อ Edge Computing โดยเฉพาะ |
| TypeScript | ใช้เพิ่ม type safety ให้ backend |
| Prisma ORM | ใช้ติดต่อฐานข้อมูลและจัดการ schema ให้ใช้งานง่าย |
| Cloudflare D1 | ฐานข้อมูลหลัก (Serverless SQLite) |
| JWT | ใช้สำหรับ Authentication และ Session Management |
| Web Crypto API | ใช้ hash รหัสผ่าน (SHA-256) ด้วย Native API ของเบราว์เซอร์/Cloudflare |
| CORS | เปิดให้ frontend จากต่างโดเมนเรียก API ได้อย่างปลอดภัย |

**หน้าที่ของ Backend:**

```
- รับ request จาก frontend ด้วยความหน่วง (Latency) ต่ำสุดผ่าน Edge
- ตรวจสอบข้อมูลและสิทธิ์ของผู้ใช้ผ่าน JWT Secret ใน Bindings
- จัดการ Authentication (รวมถึง Validate Token จาก Google)
- Query / Create / Update / Delete ข้อมูลผ่าน Prisma + D1
- ส่ง response กลับเป็น JSON
- จัดการ business logic เช่น Mission, Progress, Leaderboard, Documents
```

---

## สถาปัตยกรรมระบบ

### Request Flow

```
Browser / Client
    │
    ▼
Next.js Frontend : Vercel (Production) / localhost:3000 (Dev)
    │
    │  HTTP Request / Fetch (HTTPS)
    ▼
Hono Backend : Cloudflare Workers (*.workers.dev) / localhost:8787 (Dev)
    │
    │  Prisma ORM + @prisma/adapter-d1
    ▼
Cloudflare D1 Database (Edge SQLite)
```

### Layer การทำงาน

```
Presentation Layer
- Next.js / React UI

API Layer
- Hono Serverless REST API

Business Logic Layer
- Auth, Mission, Progress, Leaderboard, Documents, Admin CMS

Data Access Layer
- Prisma ORM

Database Layer
- Cloudflare D1 (SQLite)
```

---

## ฟีเจอร์หลักตามบทบาท

### User / Player

| ฟีเจอร์ | รายละเอียด |
|---|---|
| Register / Login | สมัครสมาชิกและเข้าสู่ระบบด้วยระบบ Custom Auth |
| Google Login | เข้าสู่ระบบผ่านบัญชี Google แบบ Client-side Token Flow (ปลอดภัยสูง) |
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
| Admin Authorization | ตรวจสอบ role ผ่าน JWT ก่อนเข้าใช้งาน API ป้องกันคนนอก |
| Favorite Mission | กดบันทึก Mission ที่สนใจ |
| Databank | ดูคำตอบและข้อมูลโจทย์ทั้งหมด |

---

## Use Case หลักของระบบ

### UC-01: สมัครสมาชิก

**Actor:** ผู้ใช้ใหม่

**Flow:**

```
1. ผู้ใช้กรอก username, email, password และ displayName
2. Frontend ส่ง POST /api/auth/register
3. Backend validate ข้อมูล
4. Backend ตรวจ username/email ซ้ำใน D1
5. Backend hash password ด้วย Web Crypto API (SHA-256)
6. Backend สร้าง verifyToken
7. Backend บันทึก user ลง database
8. Backend ส่งอีเมลยืนยันบัญชี
```

**ผลลัพธ์:** ผู้ใช้มีบัญชีในระบบและต้องยืนยันอีเมลก่อน Login

### UC-02: Login

**Actor:** ผู้ใช้ที่มีบัญชี

**Flow:**

```
1. ผู้ใช้กรอก username และ password
2. Frontend ส่ง POST /api/auth/login
3. Backend ค้นหา user จาก database D1
4. Backend ตรวจ password ด้วย Web Crypto API (SHA-256)
5. Backend ตรวจว่า email verified แล้วหรือยัง
6. Backend สร้าง JWT Token ผ่าน JWT_SECRET ใน Bindings
7. Frontend เก็บ token และ user data ลง localStorage
```

**ผลลัพธ์:** ผู้ใช้เข้าสู่ระบบสำเร็จและสามารถใช้งานระบบได้

### UC-03: เล่น Mission

**Actor:** ผู้ใช้ที่เข้าสู่ระบบแล้ว

**Flow:**

```
1. ผู้ใช้เลือก OS เช่น linux หรือ windows
2. Frontend เรียก GET /api/mission/:os/:level
3. Backend query mission จาก D1 database
4. Frontend แสดงโจทย์และ Terminal จำลอง
5. ผู้ใช้พิมพ์ command (ระบบตรวจจับ WPM/Accuracy)
6. Frontend ตรวจคำสั่งกับ expectedCommand
7. ถ้าถูกต้อง Frontend ส่ง PUT /api/user/progress
8. Backend update Level, EXP และ PlayHistory ใน D1
```

**ผลลัพธ์:** ผู้ใช้ผ่านด่าน ได้รับ EXP และระบบบันทึกความก้าวหน้า

### UC-04: ดู Documents

**Actor:** ผู้ใช้ทั่วไปหรือผู้ใช้ที่ Login แล้ว

**Flow:**

```
1. ผู้ใช้เข้า /documents
2. Frontend เรียก GET /api/docs/commands
3. Backend query ตาราง Mission ใน D1
4. Backend map Mission เป็น Command Document
5. Frontend แสดง command, syntax, example, description และ rewardExp
```

**ผลลัพธ์:** ผู้ใช้สามารถอ่านคำอธิบายคำสั่งจากข้อมูลจริงใน database

### UC-05: ดู Leaderboard

**Actor:** ผู้ใช้ทั่วไปหรือผู้ใช้ที่ Login แล้ว

**Flow:**

```
1. ผู้ใช้เปิดหน้า Leaderboard
2. Frontend เรียก GET /api/leaderboard/:os
3. Backend query user ที่มี EXP สูงสุดจาก D1
4. Backend sort ตาม EXP
5. Frontend แสดงอันดับผู้เล่น
```

**ผลลัพธ์:** ผู้ใช้เห็นอันดับผู้เล่นแยก Linux, Windows หรือ Combined

### UC-06: Admin จัดการ Mission

**Actor:** Admin

**Flow:**

```
1. Admin login
2. Frontend ส่ง request ไปยัง /api/admin/missions พร้อม Bearer Token
3. Backend ตรวจ JWT Token
4. Backend ตรวจ role ว่าเป็น admin หรือไม่
5. Admin สามารถเพิ่ม แก้ไข หรือลบ mission ผ่าน Prisma ลง D1 ได้
```

**ผลลัพธ์:** ข้อมูล Mission ใน database ถูกจัดการผ่านหน้า Admin CMS

---

## Test Case หลักของระบบ

| Test Case | Feature | Precondition / Steps | Expected Result |
|---|---|---|---|
| **TC-AUTH-001** Register สำเร็จ | Register | username และ email ยังไม่ซ้ำ → กรอกข้อมูลสมัครสมาชิกและกด Register | สร้าง user สำเร็จ, password ถูก hash, ส่งอีเมลยืนยัน |
| **TC-AUTH-002** Login ด้วย Password ผิด | Login | กรอก username ถูกต้อง แต่ password ผิด | ระบบไม่ให้ login และไม่สร้าง JWT token |
| **TC-MISSION-001** โหลด Mission สำเร็จ | Mission | เรียก `GET /api/mission/linux/1` | Backend ส่งข้อมูล mission กลับมา |
| **TC-MISSION-002** พิมพ์คำสั่งถูกต้อง | Command Validation | พิมพ์ command ตรงกับ expectedCommand | ผ่านด่าน และบันทึก progress |
| **TC-MISSION-003** พิมพ์คำสั่งผิด | Command Validation | พิมพ์ command ไม่ตรงกับ expectedCommand | ไม่ผ่านด่าน และไม่เพิ่ม EXP |
| **TC-PROGRESS-001** บันทึก Progress Linux | Save Progress | ส่ง `PUT /api/user/progress` พร้อม `os=linux` | update linuxLevel และ linuxExp |
| **TC-DOCS-001** โหลด Documents สำเร็จ | Documents | เปิดหน้า `/documents` | แสดงข้อมูลคำสั่งจาก Mission database |
| **TC-ADMIN-001** User ธรรมดาเข้า Admin API | Admin Authorization | user role ปกติเรียก `/api/admin/missions` | ระบบส่ง 403 Access Denied |

---

## โครงสร้างโปรเจกต์

### Frontend

```
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

### Backend (Serverless)

```
keyrush-backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── index.ts (Entry point ของ Hono)
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── mission.ts
│   │   ├── user.ts
│   │   └── ...
│   └── seed.ts (สคริปต์เสกข้อมูล)
├── wrangler.toml (ตั้งค่า Cloudflare Workers & D1)
├── package.json
└── tsconfig.json
```

---

## ฐานข้อมูลหลัก

### User

ใช้เก็บข้อมูลผู้ใช้และความก้าวหน้า

```
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

```
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

```
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
| Cloudflare Account | สำหรับ Deploy Workers และ D1 |
| Wrangler CLI | ติดตั้งผ่าน dependency ของ backend |
| Git | เวอร์ชันล่าสุด |

---

## วิธีเริ่มต้นใช้งาน (Local Development)

### 1. Clone Repository

```bash
git clone https://github.com/Reversenb/keyrush-frontend.git
git clone https://github.com/Reversenb/keyrush-backend.git
```

### 2. ตั้งค่า Backend (Hono + Cloudflare D1)

```bash
cd keyrush-backend
npm install
```

สร้างฐานข้อมูล D1 แบบ Local ผ่าน Wrangler และอัปเดต Schema:

```bash
npx wrangler d1 migrations apply keyrush-db --local
```

ตั้งค่า Secret สำหรับ JWT (สร้างไฟล์ `.dev.vars` สำหรับรันทดสอบในเครื่อง):

```
JWT_SECRET=your_jwt_secret_key
SEED_PASSWORD=your_seed_password
```

รันสคริปต์เสกข้อมูลจำลอง (Seed):

```bash
npm run seed
```

รัน backend:

```bash
npm run dev
# หรือ npx wrangler dev
```

Backend จะรันที่:

```
http://localhost:8787
```

### 3. ตั้งค่า Frontend (Next.js)

```bash
cd keyrush-frontend
npm install
```

สร้างไฟล์ `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8787
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

รัน frontend:

```bash
npm run dev
```

Frontend จะรันที่:

```
http://localhost:3000
```

---

## บัญชีทดสอบ

| Username / Email | Role | หมายเหตุ |
|---|---|---|
| `admin@keyrush.local` | Admin | ใช้ทดสอบหน้า Admin CMS |
| `player1@keyrush.local` | User | ใช้ทดสอบระบบผู้เล่นทั่วไป |

> **หมายเหตุ:** บัญชีทดสอบขึ้นอยู่กับข้อมูลใน seed script ของ backend

---

## คำสั่งที่ใช้บ่อย

### Backend

```bash
npm run dev
npm run deploy
npx wrangler d1 migrations apply keyrush-db --local
npx wrangler d1 migrations apply keyrush-db --remote
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
| Command Validation | ยังตรวจคำสั่งโดยเทียบกับ expectedCommand เป็นหลัก |
| Analytics | บาง metric ยังต้องเพิ่มระบบ log เช่น retention, retry count |
| Serverless DB Limits | Cloudflare D1 ในแพ็กเกจฟรีมีจำกัดจำนวน Read/Write ต่อวัน แต่เพียงพอต่อการใช้งานระดับโปรเจกต์ขนาดกลาง |
| Edge Function Size | โค้ด Backend เมื่อมัดรวม (Build) ต้องมีขนาดไม่เกินโควต้าของ Cloudflare Workers |
| Survival Mode | อยู่ในระหว่างการพัฒนาแผนงาน เพื่อเพิ่มโหมดแข่งกับเวลา |
| Realtime PvP | เวอร์ชันปัจจุบันเน้น Stateless REST API และถอด PvP ออกเพื่อให้ระบบเบาขึ้น |

---

## สรุป

KeyRush เป็นเว็บแอปสำหรับฝึกใช้คำสั่ง Terminal และ Command Line ผ่านรูปแบบภารกิจ โดยมีระบบผู้ใช้ ระบบยืนยันตัวตนแบบ Client-side Token Flow ระบบด่านฝึกซ้อม ระบบเก็บ EXP และ Level ระบบสถิติ ระบบเอกสารคำสั่ง ระบบจัดอันดับ และระบบ Admin CMS

- **Frontend** ทำหน้าที่เป็นส่วนติดต่อผู้ใช้และเรียกใช้งาน API ขับเคลื่อนด้วยสถาปัตยกรรม Edge Computing
- **Backend** ทำหน้าที่เป็น REST API Server แบบ Serverless โดยจัดการ Business Logic ผ่าน Hono Framework
- **Database** ใช้เก็บข้อมูลผู้ใช้ Mission และสถิติการเล่นด้วย Cloudflare D1 (Serverless SQLite)
- **Prisma** ทำหน้าที่เป็นตัวกลางในการสื่อสารและจัดการ Schema ฐานข้อมูล

โปรเจกต์นี้แสดงให้เห็นการทำงานครบตั้งแต่ Frontend, Backend, Database, Authentication, Authorization, API Design ไปจนถึงการใช้งานโครงสร้างพื้นฐานระดับ Modern Serverless อย่างเต็มรูปแบบ
