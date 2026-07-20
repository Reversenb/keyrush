# KeyRush — ระบบฝึกพิมพ์คำสั่ง (Interactive Terminal Training)

KeyRush เป็นเว็บแอปพลิเคชันสำหรับฝึกใช้งานคำสั่ง Command Line ของระบบปฏิบัติการ Linux และ Windows ผ่านรูปแบบเกมภารกิจ ผู้ใช้สามารถเลือกด่าน ฝึกพิมพ์คำสั่งใน Terminal จำลอง (xterm.js) พร้อมเห็นภาพจำลองผลของคำสั่งแบบเรียลไทม์ เก็บ EXP เพิ่ม Level ดูสถิติการเล่นย้อนหลังผ่านปฏิทิน และแข่งขันคะแนนผ่าน Leaderboard ได้

โปรเจกต์นี้แบ่งออกเป็น 2 repository หลัก ได้แก่

- **keyrush-frontend** — ส่วนหน้าเว็บ พัฒนาด้วย Next.js, React, TypeScript และ Tailwind CSS
- **keyrush-backend** — ส่วน API Server พัฒนาด้วย Hono, Cloudflare Workers, TypeScript, Prisma และ Cloudflare D1 (SQLite)

ระบบถูกออกแบบเป็น Serverless REST API เพื่อให้โครงสร้างเบา ประมวลผลได้รวดเร็วบน Edge Network ทั่วโลก และรองรับผู้ใช้งานจำนวนมากได้โดยไม่ต้องจัดการเซิร์ฟเวอร์เอง

---

## สารบัญ

- [ภาพรวมและจุดประสงค์](#ภาพรวมและจุดประสงค์)
- [เทคโนโลยีที่ใช้](#เทคโนโลยีที่ใช้)
- [สถาปัตยกรรมระบบ](#สถาปัตยกรรมระบบ)
- [ระบบความปลอดภัย](#ระบบความปลอดภัย)
- [ฟีเจอร์หลักตามบทบาท](#ฟีเจอร์หลักตามบทบาท)
- [Use Case หลักของระบบ](#use-case-หลักของระบบ)
- [Test Case หลักของระบบ](#test-case-หลักของระบบ)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [ฐานข้อมูลหลัก](#ฐานข้อมูลหลัก)
- [API Endpoints](#api-endpoints)
- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [วิธีเริ่มต้นใช้งาน (Local Development)](#วิธีเริ่มต้นใช้งาน-local-development)
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
| การยืนยันตัวตน | Google OAuth (Client-side Token Flow) + JWT ผ่าน **HttpOnly Cookie** พร้อมระบบป้องกัน CSRF |
| การตรวจคำตอบ | **Server-authoritative** — ตรวจที่ Backend ทั้งหมด ป้องกันการโกงจากฝั่ง Client |
| ฐานข้อมูล | Cloudflare D1 (Serverless SQLite) |
| ORM | Prisma (พร้อม `@prisma/adapter-d1`) |
| รูปแบบ API | Serverless REST API |

**Workflow หลักของระบบ:**

```
Login ด้วย Google → เลือก OS → เลือกด่าน → อ่านโจทย์ → พิมพ์คำสั่งใน Terminal จำลอง
→ Backend ตรวจคำตอบ (server-side) → บันทึก EXP/Level → แสดงผลบน Dashboard / History / Leaderboard
```

---

## เทคโนโลยีที่ใช้

### Frontend (`keyrush-frontend/`)

| เทคโนโลยี | รายละเอียด |
|---|---|
| Next.js (App Router) | React Framework จัดการ Routing และทำหน้าที่เป็น API Proxy (rewrites) ให้ Cookie เป็น first-party |
| React + TypeScript | สร้าง UI Components พร้อมความปลอดภัยของชนิดข้อมูล |
| Tailwind CSS | Styling สไตล์ Modern & Glassmorphism รองรับธีมพื้นฐาน (Cute / Dark) + ธีมพรีเมียมจากร้านค้า (Hacker / Sakura / …) ผ่าน `next-themes` |
| xterm.js | Terminal Emulator จริงในเบราว์เซอร์ ปรับสี/ฟอนต์/พื้นหลังได้ พร้อมเอฟเฟกต์ CRT scanline |
| Framer Motion | Animation ของ UI และระบบจำลองผลคำสั่ง (Virtual File System) |
| `@react-oauth/google` | Login ผ่านบัญชี Google แบบ Client-side Token Flow |
| Fetch API (ผ่าน `lib/api.ts`) | ตัวกลางเรียก REST API จุดเดียว — แนบ credentials, CSRF Token และจัดการ 401 อัตโนมัติ |

**หน้าที่ของ Frontend:**

```
- แสดง UI ให้ผู้ใช้ใช้งาน (Gamified Terminal + Virtual File System Animation)
- จับ Keystroke ที่พิมพ์เข้า Terminal จริง คำนวณ WPM และ Accuracy แบบ Real-time
  (ใช้ "เวลาพิมพ์จริง" — หยุดพัก/สลับแท็บไม่ทำให้ค่าเพี้ยน)
- จำลองผลของคำสั่ง ~100 คำสั่ง (Linux/Windows) ผ่าน Command Simulation Engine
- เรียก API ผ่าน fetch wrapper กลางที่แนบ Cookie + CSRF Header ให้อัตโนมัติ
- แสดงข้อมูล Mission, Progress, Documents, History (พร้อมปฏิทิน), Leaderboard
- จัดการ routing เช่น /dashboard, /campaignpage, /campaignplay, /docs, /history, /leaderboard
```

### Backend (`keyrush-backend/`)

| เทคโนโลยี | รายละเอียด |
|---|---|
| Cloudflare Workers | Runtime สำหรับรันโค้ดฝั่ง Server แบบ Serverless บน Edge Network |
| Hono | Web API Framework สุดเบาและเร็ว ออกแบบมาเพื่อ Edge Computing โดยเฉพาะ |
| TypeScript | เพิ่ม type safety ให้ backend |
| Prisma ORM | ติดต่อฐานข้อมูลและจัดการ schema |
| Cloudflare D1 | ฐานข้อมูลหลัก (Serverless SQLite) |
| JWT (HttpOnly Cookie) | Authentication — ออก Token หลัง Verify บัญชี Google แล้วส่งผ่าน `Set-Cookie` (JS ฝั่ง Client อ่านไม่ได้) |
| CSRF Protection | Double-submit cookie (`csrf_token` + Header `X-CSRF-Token`) สำหรับทุก Request ที่เปลี่ยนแปลงข้อมูล |
| Anti-cheat Tokens | `sessionToken` (ออกตอนโหลดโจทย์) และ `clearanceToken` (ออกเมื่อตอบถูก) ป้องกันการยิง API ตรงเพื่อโกง |

**หน้าที่ของ Backend:**

```
- รับ request จาก frontend ด้วยความหน่วง (Latency) ต่ำผ่าน Edge
- Validate Token จาก Google และออก JWT ผ่าน HttpOnly Cookie (อายุ 4 ชั่วโมง)
- ตรวจสอบสิทธิ์ผู้ใช้จาก Cookie + ตรวจ CSRF Token ทุก POST/PUT/DELETE
- ตรวจคำตอบของด่าน (server-authoritative) — เฉลยไม่ถูกส่งให้ Client ล่วงหน้า
- คำนวณ EXP ที่ได้จริง (หักเหลือ 20% ถาวรถ้าผู้เล่นกดดูเฉลยของด่านนั้น)
- Query / Create / Update / Delete ข้อมูลผ่าน Prisma + D1
- จัดการ business logic: Auth, Mission, Progress, Leaderboard, Documents, Admin CMS
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
    │  fetch('/api/...')  ← เรียกแบบ same-origin
    ▼
Next.js Rewrites Proxy (next.config.ts)
    │
    │  ส่งต่อ (proxy) ไปยัง Backend — ทำให้ Cookie เป็น first-party
    ▼
Hono Backend : Cloudflare Workers (*.workers.dev) / localhost:8787 (Dev)
    │
    │  Prisma ORM + @prisma/adapter-d1
    ▼
Cloudflare D1 Database (Edge SQLite)
```

> **จุดสำคัญ:** Frontend ไม่เรียก Backend ข้ามโดเมนโดยตรง แต่เรียกผ่าน `/api/*` บนโดเมนตัวเอง
> แล้วให้ Next.js rewrites ส่งต่อ (proxy) ไปยัง Cloudflare Workers — ทำให้ Cookie ของระบบ Auth
> เป็น first-party cookie (แก้ปัญหา third-party cookie ถูกบล็อกใน Safari และทำให้
> Double-submit CSRF ทำงานได้ เพราะ JavaScript อ่าน cookie ข้ามโดเมนไม่ได้)

### Layer การทำงาน

```
Presentation Layer
- Next.js / React UI + xterm.js Terminal + Framer Motion Animation

Simulation Layer (Client)
- lib/commandSim.ts — จำลองผลของคำสั่ง ~100 คำสั่ง (output + Virtual File System)

API Layer
- Hono Serverless REST API (ผ่าน Next.js Rewrites Proxy)

Business Logic Layer
- Auth (Cookie + CSRF), Mission Verify (Anti-cheat), Progress, Leaderboard, Documents, Admin CMS

Data Access Layer
- Prisma ORM

Database Layer
- Cloudflare D1 (SQLite)
```

---

## ระบบความปลอดภัย

| กลไก | รายละเอียด |
|---|---|
| HttpOnly Cookie | JWT ถูกเก็บใน `auth_token` cookie ที่ JavaScript อ่านไม่ได้ — ป้องกัน Token ถูกขโมยผ่าน XSS |
| CSRF Protection | Double-submit: Backend ออก `csrf_token` cookie (อ่านได้) และทุก POST/PUT/DELETE ต้องแนบ Header `X-CSRF-Token` ให้ค่าตรงกัน ไม่งั้นได้ 403 |
| Session อายุจำกัด | JWT อายุ 4 ชั่วโมง หมดแล้ว Backend ตอบ 401 → Frontend เคลียร์ state และพาไปหน้า Login อัตโนมัติ |
| Server-authoritative Verify | เฉลย (`expectedCommand`) ไม่ถูกส่งให้ Client — การตรวจคำตอบทำที่ Backend ผ่าน `POST /api/mission/verify` เท่านั้น |
| Anti-cheat Tokens | โหลดโจทย์ได้ `sessionToken` → ต้องแนบตอน verify → ตอบถูกได้ `clearanceToken` → ต้องแนบตอนเซฟ EXP — ยิง API ตรงเพื่อเซฟคะแนนปลอมไม่ได้ |
| ตรวจจับการเล่นผิดปกติ | Backend ตรวจความเร็วการตอบ หากผิดปกติจะปฏิเสธ (403) |
| บทลงโทษการดูเฉลย | กดดูเฉลยด่านไหน Server จดถาวร — EXP ของด่านนั้นเหลือ 20% แม้ออกจากเกมแล้วกลับมาเล่นใหม่ |
| Security Headers | Frontend ตั้งค่า CSP, HSTS, X-Frame-Options, Referrer-Policy ฯลฯ ผ่าน `next.config.ts` |
| Logout ฝั่ง Server | `POST /api/auth/logout` — Server revoke token และเคลียร์ cookie เอง ไม่ใช่แค่ลบ state ฝั่ง Client |

---

## ฟีเจอร์หลักตามบทบาท

### User / Player

| ฟีเจอร์ | รายละเอียด |
|---|---|
| Google Login | เข้าสู่ระบบผ่านบัญชี Google (ไม่มีระบบ Password) — Session เก็บใน HttpOnly Cookie |
| Campaign Mode | เล่นด่านฝึกคำสั่ง Linux / Windows ใน Terminal จำลอง xterm.js |
| Command Simulation | พิมพ์คำสั่งแล้วเห็น "ผลจริง" — output สมจริง (ping ทยอยตอบทีละบรรทัด, ps แสดงตาราง ฯลฯ) พร้อมภาพจำลองไฟล์/โฟลเดอร์เปลี่ยนตามคำสั่ง (สร้าง ลบ ย้าย บีบอัด ตั้งสิทธิ์ ครอบคลุม ~100 คำสั่ง แยก 9 หมวดอนิเมชัน) |
| WPM / Accuracy | คำนวณจากคีย์ที่พิมพ์เข้า Terminal จริง (มาตรฐาน 1 word = 5 ตัวอักษร) ใช้เวลาพิมพ์จริง — พัก/สลับแท็บไม่ทำให้ค่าตก |
| Hint & ดูเฉลย | ขอคำใบ้ฟรี หรือกด "ดูเฉลย" (มี dialog ยืนยัน) แลกกับ EXP ของด่านนั้นเหลือ 20% ถาวร |
| Progress Tracking | เก็บ Level และ EXP แยกตาม OS พร้อมแสดง EXP ที่ได้จริงต่อรอบ (เต็มหรือโดนหัก) |
| Dashboard | สถิติส่วนตัว — กราฟ WPM (แกนมาตรฐาน + เส้นค่าเฉลี่ย + tooltip), วงแหวน Accuracy ตามเกณฑ์คุณภาพ |
| History + ปฏิทิน | ประวัติการเล่นย้อนหลัง พร้อมปฏิทินรายเดือน (วันไหนเล่นเยอะสีเข้ม) จิ้มวันเพื่อกรองดูเฉพาะวันนั้น |
| Documents | คู่มือคำสั่ง Linux / Windows CMD จากฐานข้อมูลจริง |
| Leaderboard | อันดับผู้เล่นแยก Linux / Windows / Combined |
| Ranks | ระบบแรงค์ 7 ระดับตาม EXP รวม (Rookie → Root Master) |
| Profile | แก้ไขชื่อ, Bio, เลือก Bot Avatar 50 แบบ หรืออัปโหลดรูปพร้อม Crop |
| Public Profile | ดูโปรไฟล์ผู้เล่นคนอื่นผ่าน `/u/[username]` |
| ธีม 3 แบบ | Cute (ส้ม) / Dark (ม่วง-เหลือง) / Hacker (ดำ-เขียว) — Terminal เปลี่ยนชุดสีตามธีมอัตโนมัติ |

### Admin

| ฟีเจอร์ | รายละเอียด |
|---|---|
| Mission Management | เพิ่ม แก้ไข ลบ Mission (โจทย์, เฉลย, คำใบ้, EXP) |
| Docs Management | เพิ่ม แก้ไข ลบ เอกสารคำสั่งในหน้า Documents |
| Admin Authorization | ตรวจสอบ role จากข้อมูลผู้ใช้ฝั่ง Server ก่อนเข้าใช้งาน — user ธรรมดาเข้าไม่ได้ |
| Favorite Mission | บันทึก Mission ที่สนใจ |

---

## Use Case หลักของระบบ

### UC-01: Login ด้วย Google

**Actor:** ผู้ใช้ (ใหม่หรือเดิม)

**Flow:**

```
1. ผู้ใช้กด Login ด้วย Google
2. Frontend รับ Access Token ผ่าน @react-oauth/google
3. Frontend ส่ง POST /api/auth/google พร้อม Token (credentials: 'include')
4. Backend ตรวจสอบความถูกต้องของ Token กับ Google
5. Backend ค้นหา user จาก email ใน D1 หากไม่พบให้สร้าง user ใหม่อัตโนมัติ
6. Backend ออก JWT แล้วส่งกลับผ่าน Set-Cookie 2 ตัว:
   - auth_token  (HttpOnly — JS อ่านไม่ได้)
   - csrf_token  (อ่านได้ — ใช้ทำ Double-submit CSRF)
7. Frontend ใช้ user object จาก response body เซ็ต state (ไม่มี token ใน body)
```

**ผลลัพธ์:** ผู้ใช้เข้าสู่ระบบสำเร็จ Session ปลอดภัยจาก XSS เพราะ Token อยู่ใน HttpOnly Cookie

### UC-02: เล่น Mission (Server-authoritative)

**Actor:** ผู้ใช้ที่เข้าสู่ระบบแล้ว

**Flow:**

```
1. ผู้ใช้เลือก OS (linux / windows) และเข้าเล่นด่าน
2. Frontend เรียก GET /api/mission/:os/:level → ได้โจทย์ + sessionToken (ไม่มีเฉลย)
3. ผู้ใช้พิมพ์ command ใน Terminal จำลอง
   - Frontend จำลองผลของคำสั่งทันที (output + อนิเมชันไฟล์/โฟลเดอร์)
   - ระบบนับ WPM / Accuracy จากคีย์ที่เข้า Terminal จริง
4. เมื่อกด Enter — Frontend ส่ง POST /api/mission/verify
   พร้อม { os, level, userCommand, sessionToken }
5. Backend ตรวจคำตอบ ถ้าถูกต้อง → ตอบ isCorrect: true + correctAnswer + clearanceToken
6. Frontend ส่ง PUT /api/user/progress พร้อม clearanceToken
7. Backend ตรวจ clearanceToken → update Level, EXP (earnedExp — เต็มหรือ 20% ถ้าเคยดูเฉลย)
   และบันทึก PlayHistory
```

**ผลลัพธ์:** ผู้ใช้ผ่านด่าน ได้รับ EXP ตามจริง — การโกงด้วยการยิง API ตรงถูกป้องกันด้วย token ทั้งสองชั้น

### UC-03: ดูเฉลย (Reveal)

**Actor:** ผู้ใช้ที่เข้าสู่ระบบแล้ว

**Flow:**

```
1. ผู้ใช้กดปุ่ม "ดูเฉลย" ข้างปุ่ม Hint
2. Frontend แสดง Dialog ยืนยัน — เตือนว่า EXP ด่านนี้จะเหลือ 20% อย่างถาวร
3. เมื่อยืนยัน Frontend จึงส่ง POST /api/mission/reveal { os, level }
4. Backend จดถาวรว่าด่านนี้ใช้เฉลย แล้วตอบ expectedCommand กลับมา
5. Frontend แสดงเฉลยให้พิมพ์ตาม — ผู้เล่นยังต้องพิมพ์ให้ verify ผ่านเหมือนเดิม
```

**ผลลัพธ์:** ผู้เล่นติดด่านมีทางไปต่อ โดยแลกกับบทลงโทษ EXP ที่ Server บังคับใช้จริง

### UC-04: ดู Documents

```
1. ผู้ใช้เข้า /docs
2. Frontend เรียก GET /api/docs/linux และ GET /api/docs/windows
3. Backend query ตารางเอกสารคำสั่งใน D1
4. Frontend แสดง command, description, example แยกตาม OS พร้อมช่องค้นหา
```

### UC-05: ดู Leaderboard

```
1. ผู้ใช้เปิดหน้า Leaderboard
2. Frontend เรียก GET /api/leaderboard/:os (linux / windows / combined)
3. Backend query และ sort ผู้เล่นตาม EXP
4. Frontend แสดงอันดับ พร้อมลิงก์ไปโปรไฟล์สาธารณะของแต่ละคน
```

### UC-06: Admin จัดการ Mission / Docs

```
1. Admin login — Frontend ตรวจ role จากข้อมูลผู้ใช้ที่ Backend ตอบ (ไม่เชื่อ cache ฝั่ง client)
2. ทุก request แนบ Cookie + X-CSRF-Token อัตโนมัติผ่าน fetch wrapper กลาง
3. Backend ตรวจ JWT จาก Cookie + ตรวจ role ว่าเป็น admin
4. Admin เพิ่ม / แก้ไข / ลบ Mission และ Docs ผ่าน Prisma ลง D1
```

---

## Test Case หลักของระบบ

| Test Case | Feature | Precondition / Steps | Expected Result |
|---|---|---|---|
| **TC-AUTH-001** Login ด้วย Google สำเร็จ | Google Login | ผู้ใช้กด Login ด้วย Google และยืนยันบัญชี | Backend validate Token, ออก JWT ผ่าน Set-Cookie (auth_token + csrf_token), body มีเฉพาะ user object |
| **TC-AUTH-002** Google Token ไม่ถูกต้อง | Google Login | ส่ง Token ที่หมดอายุหรือปลอมไปยัง `/api/auth/google` | ระบบปฏิเสธ ไม่ออก Cookie |
| **TC-AUTH-003** Session หมดอายุ | Session | ใช้งานหลัง JWT หมดอายุ (4 ชม.) | Backend ตอบ 401, Frontend เคลียร์ state และพาไปหน้า Login อัตโนมัติ |
| **TC-CSRF-001** POST โดยไม่มี CSRF Header | CSRF Protection | ยิง POST/PUT/DELETE โดยมี Cookie แต่ไม่แนบ `X-CSRF-Token` | Backend ตอบ 403 |
| **TC-MISSION-001** โหลด Mission สำเร็จ | Mission | เรียก `GET /api/mission/linux/1` | ได้ข้อมูลโจทย์ + sessionToken (ไม่มี expectedCommand) |
| **TC-MISSION-002** พิมพ์คำสั่งถูกต้อง | Server Verify | ส่งคำตอบถูกไปยัง `/api/mission/verify` พร้อม sessionToken | isCorrect: true พร้อม correctAnswer และ clearanceToken |
| **TC-MISSION-003** พิมพ์คำสั่งผิด | Server Verify | ส่งคำตอบผิดไปยัง `/api/mission/verify` | isCorrect: false ไม่ได้ clearanceToken |
| **TC-CHEAT-001** เซฟโดยไม่มี clearanceToken | Anti-cheat | ยิง `PUT /api/user/progress` ตรงโดยไม่ผ่าน verify | Backend ตอบ 403 ไม่บันทึก EXP |
| **TC-REVEAL-001** ดูเฉลยแล้วโดนหัก EXP | Reveal Penalty | กดดูเฉลย → ผ่านด่าน | earnedExp = 20% ของ rewardExp และยังโดนหักแม้กลับมาเล่นด่านนี้ใหม่ |
| **TC-PROGRESS-001** บันทึก Progress Linux | Save Progress | ผ่านด่านแล้วส่ง `PUT /api/user/progress` (os=linux) | update linuxLevel / linuxExp และตอบ earnedExp ที่ได้จริง |
| **TC-DOCS-001** โหลด Documents สำเร็จ | Documents | เปิดหน้า `/docs` | แสดงข้อมูลคำสั่งจาก database ทั้ง Linux และ Windows |
| **TC-ADMIN-001** User ธรรมดาเข้า Admin API | Admin Authorization | user role ปกติเรียก `/api/admin/missions` | ระบบส่ง 403 Access Denied |

---

## โครงสร้างโปรเจกต์

### Frontend

```
keyrush-frontend/
├── app/
│   ├── page.tsx            (Landing Page + Google Login)
│   ├── login/              (หน้า Login)
│   ├── welcome/            (หน้าต้อนรับหลัง Login / ตั้งชื่อครั้งแรก)
│   ├── dashboard/          (สถิติส่วนตัว + กราฟ WPM / Accuracy)
│   ├── map/                (เลือกโหมดการเล่น)
│   ├── campaignpage/       (แผนที่ด่าน Campaign)
│   ├── campaignplay/       (หน้าเล่นเกม — Terminal + Simulation + Verify)
│   ├── history/            (ประวัติการเล่น + ปฏิทินกรองรายวัน)
│   ├── docs/               (คู่มือคำสั่ง Linux / Windows)
│   ├── leaderboard/        (ตารางอันดับ)
│   ├── ranks/              (ระบบแรงค์ 7 ระดับ)
│   ├── profile/            (แก้ไขโปรไฟล์ / เลือก Avatar)
│   ├── u/[username]/       (โปรไฟล์สาธารณะ)
│   └── admin/missions/     (Admin CMS จัดการ Mission และ Docs)
├── components/
│   ├── Navbar.tsx              (เมนูหลัก — sync ข้อมูลผู้ใช้กับ Backend)
│   ├── TerminalBox.tsx         (xterm.js Terminal + ธีมสี + รายงานคีย์สำหรับ WPM)
│   ├── TerminalControls.tsx    (แผงปรับสี/ขนาดฟอนต์ Terminal)
│   ├── VirtualFileSystemPanel.tsx (ภาพจำลองไฟล์/โฟลเดอร์ + อนิเมชัน 9 หมวด + Hint/เฉลย)
│   ├── MissionClearedModal.tsx (สรุปผลจบด่าน — เกรด, EXP ที่ได้จริง)
│   └── ...
├── lib/
│   ├── api.ts        (fetch wrapper กลาง — credentials + CSRF + 401 handler + logout)
│   ├── commandSim.ts (Command Simulation Engine ~100 คำสั่ง)
│   └── ranks.ts      (ข้อมูลแรงค์กลาง — แก้ที่เดียวมีผลทุกหน้า)
├── public/
├── next.config.ts    (API Proxy rewrites + Security Headers)
├── package.json
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
googleId
displayName
avatar
bio
role
linuxLevel
linuxExp
windowsLevel
windowsExp
adminFavorites
createdAt
```

### Mission

ใช้เก็บข้อมูลด่าน (เฉลย `expectedCommand` อยู่ฝั่ง Server เท่านั้น ไม่ถูกส่งให้ผู้เล่น)

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
earnedExp
createdAt
```

---

## API Endpoints

> ทุก endpoint ที่เปลี่ยนแปลงข้อมูล (POST/PUT/DELETE) ต้องแนบ Cookie + Header `X-CSRF-Token`
> ยกเว้น `/api/auth/google` — Frontend จัดการให้อัตโนมัติผ่าน `lib/api.ts`

### Authentication

| Method | Endpoint | รายละเอียด |
|---|---|---|
| POST | `/api/auth/google` | Login / สมัครสมาชิกอัตโนมัติด้วย Google — ตอบ user object และ Set-Cookie (auth_token, csrf_token) |
| POST | `/api/auth/logout` | ออกจากระบบ — Server revoke token และเคลียร์ Cookie |

### User

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/user/progress` | ดึงข้อมูลผู้ใช้และ progress (ใช้เช็คสถานะ login ด้วย) |
| PUT | `/api/user/progress` | บันทึก progress — ต้องแนบ `clearanceToken` จากการ verify, ตอบ `earnedExp` ที่ได้จริง |
| GET | `/api/user/stats` | ดึงสถิติ WPM / Accuracy และประวัติการเล่นล่าสุด (recentLessons) |
| PUT | `/api/user/profile` | แก้ไข displayName / avatar / bio |
| GET | `/api/user/profile/public/:username` | ดู public profile |

### Mission

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/mission/:os/:level` | ดึงโจทย์ตาม OS และ Level — ตอบพร้อม `sessionToken` (ไม่มีเฉลย) |
| POST | `/api/mission/verify` | ตรวจคำตอบฝั่ง Server — body: `{ os, level, userCommand, sessionToken }` ตอบ `isCorrect`, `correctAnswer`, `clearanceToken` |
| POST | `/api/mission/reveal` | ขอดูเฉลย — Server จดถาวร EXP ด่านนั้นเหลือ 20% แล้วตอบ `expectedCommand` |

### Documents

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/docs/linux` | ดึงเอกสารคำสั่ง Linux |
| GET | `/api/docs/windows` | ดึงเอกสารคำสั่ง Windows |

### Leaderboard

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/leaderboard/:os` | ดึงอันดับผู้เล่น (`linux` / `windows` / `combined`) |

### Admin

| Method | Endpoint | รายละเอียด |
|---|---|---|
| GET | `/api/admin/missions` | ดึง mission ทั้งหมด (พร้อมเฉลย — admin เท่านั้น) |
| POST | `/api/admin/missions` | สร้าง mission ใหม่ |
| PUT | `/api/admin/missions/:id` | แก้ไข mission |
| DELETE | `/api/admin/missions/:id` | ลบ mission |
| POST | `/api/admin/docs` | สร้างเอกสารคำสั่งใหม่ |
| PUT | `/api/admin/docs/:id` | แก้ไขเอกสารคำสั่ง |
| DELETE | `/api/admin/docs/:id` | ลบเอกสารคำสั่ง |

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
GOOGLE_CLIENT_ID=your_google_client_id
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

> `NEXT_PUBLIC_API_URL` ถูกใช้เป็นปลายทางของ **API Proxy** ใน `next.config.ts`
> — Browser จะเรียก `/api/*` บนโดเมนของ Frontend เสมอ แล้ว Next.js ส่งต่อให้ Backend เอง
> (Cookie จึงเป็น first-party และระบบ CSRF ทำงานได้ทั้งบนเครื่องและบน Production)

รัน frontend:

```bash
npm run dev
```

Frontend จะรันที่:

```
http://localhost:3000
```

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
npx tsc --noEmit   # ตรวจ type ทั้งโปรเจกต์
```

---

## ข้อจำกัดของระบบ

| หัวข้อ | รายละเอียด |
|---|---|
| Command Simulation | การจำลองผลคำสั่งฝั่ง Client เป็นการจำลองเพื่อการเรียนรู้ (ไม่ใช่ Shell จริง) — output บางคำสั่งเป็นข้อมูลตัวอย่าง |
| History Calendar | ปฏิทินแสดงข้อมูลจากประวัติล่าสุดที่ Backend ส่งมา (recentLessons) — วันที่เก่ากว่านั้นจะไม่แสดงจุดกิจกรรม |
| Session | JWT อายุ 4 ชั่วโมง — หมดอายุต้อง Login ใหม่ (ออกแบบเพื่อความปลอดภัย) |
| Analytics | บาง metric ยังต้องเพิ่มระบบ log เช่น retention, retry count |
| Serverless DB Limits | Cloudflare D1 แพ็กเกจฟรีจำกัดจำนวน Read/Write ต่อวัน แต่เพียงพอต่อโปรเจกต์ขนาดกลาง |
| Edge Function Size | โค้ด Backend เมื่อ Build ต้องมีขนาดไม่เกินโควต้าของ Cloudflare Workers |
| Survival Mode / Hacker Arena | อยู่ระหว่างการวางแผนพัฒนาในเวอร์ชันถัดไป |

---

## สรุป

KeyRush เป็นเว็บแอปสำหรับฝึกใช้คำสั่ง Terminal และ Command Line ผ่านรูปแบบภารกิจ โดยมีระบบยืนยันตัวตนด้วย Google OAuth + HttpOnly Cookie พร้อมการป้องกัน CSRF, ระบบตรวจคำตอบแบบ Server-authoritative พร้อมกลไกกันโกงสองชั้น (sessionToken / clearanceToken), ระบบจำลองผลคำสั่งพร้อมอนิเมชันครอบคลุมประมาณ 100 คำสั่ง, ระบบเก็บ EXP และ Level พร้อมบทลงโทษการดูเฉลย, ระบบสถิติและประวัติแบบปฏิทิน, ระบบจัดอันดับ, ระบบแรงค์ และระบบ Admin CMS

- **Frontend** ทำหน้าที่เป็นส่วนติดต่อผู้ใช้ (Gamified Terminal ด้วย xterm.js + Framer Motion) เรียก API ผ่าน Proxy บนโดเมนตัวเองเพื่อความปลอดภัยของ Cookie
- **Backend** ทำหน้าที่เป็น REST API Server แบบ Serverless เป็นผู้ตัดสินความถูกต้องของคำตอบและคะแนนแต่เพียงผู้เดียว
- **Database** ใช้ Cloudflare D1 (Serverless SQLite) เก็บข้อมูลผู้ใช้ Mission และสถิติการเล่น
- **Prisma** เป็นตัวกลางสื่อสารและจัดการ Schema ฐานข้อมูล

โปรเจกต์นี้แสดงให้เห็นการทำงานครบตั้งแต่ Frontend, Backend, Database, Authentication (Cookie-based), Authorization, CSRF Protection, Anti-cheat Design, API Design ไปจนถึงการใช้งานโครงสร้างพื้นฐานระดับ Modern Serverless อย่างเต็มรูปแบบ
