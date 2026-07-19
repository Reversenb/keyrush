import { ImageResponse } from 'next/og';

// 🖼️ รูป Banner ตอนแชร์ลิงก์ — เรนเดอร์สดเป็น PNG จากโค้ด (คมชัดกว่าไฟล์ JPG)
// หน้าตาล้อ hero หน้าแรกในธีมมืด (พื้นม่วงเข้ม + เหลือง) จัดกึ่งกลาง
export const runtime = 'edge';
export const alt = 'KeyRush — ฝึกพิมพ์คำสั่ง Terminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// ── ข้อความทั้งหมดในรูป (รวมไว้ที่เดียว) ──
const T = {
  logo: '>_',
  brand: 'KeyRush',
  badge: 'ระบบฝึกพิมพ์คำสั่ง',
  line1: 'Master the',
  line2: 'Command Line',
  sub: 'ฝึกพิมพ์คำสั่ง Linux & Windows ในระบบจำลอง สนุก ปลอดภัย เก่งขึ้นชัวร์',
  cta1: 'เริ่มฝึกพิมพ์เลย!',
  cta2: 'บทเรียน',
};

// สร้างชุดตัวอักษรสำหรับ subset ฟอนต์ "จากข้อความจริง" — กันตกหล่นจนตัวอักษรหาย
// (เดิมพิมพ์มือ เสี่ยงลืมตัวใดตัวหนึ่งแล้วขึ้นเป็นช่องว่าง)
const USED_TEXT = Array.from(new Set(Object.values(T).join('') + ' ')).join('');

// โหลดฟอนต์ Prompt (รองรับไทย) — Satori อ่านได้เฉพาะ ttf/otf ไม่รองรับ woff2
async function loadPrompt(weight: number): Promise<ArrayBuffer | null> {
  const urls = [
    // 1) แบบ subset เฉพาะตัวอักษรที่ใช้ — ไฟล์เล็ก โหลดไว
    `https://fonts.googleapis.com/css2?family=Prompt:wght@${weight}&text=${encodeURIComponent(USED_TEXT)}`,
    // 2) สำรอง: ฟอนต์เต็ม เผื่อแบบ subset มีปัญหา
    `https://fonts.googleapis.com/css2?family=Prompt:wght@${weight}`,
  ];
  for (const url of urls) {
    try {
      const css = await (await fetch(url)).text();
      const src = css.match(/src:\s*url\((.+?)\)\s*format\('(?:opentype|truetype)'\)/);
      if (!src) continue;
      const buf = await (await fetch(src[1])).arrayBuffer();
      if (buf.byteLength > 0) return buf;
    } catch {
      // ลองอันถัดไป
    }
  }
  return null; // โหลดไม่ได้ก็ยังเรนเดอร์รูปออก ดีกว่าพัง 500
}

export default async function OgImage() {
  const [bold, regular] = await Promise.all([loadPrompt(700), loadPrompt(400)]);

  const fonts = [
    ...(bold ? [{ name: 'Prompt', data: bold, weight: 700 as const, style: 'normal' as const }] : []),
    ...(regular ? [{ name: 'Prompt', data: regular, weight: 400 as const, style: 'normal' as const }] : []),
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#1E1B2E',
          // ดวงแสงนุ่มๆ ล้อ background blobs ของหน้าเว็บ
          // ⚠️ ไล่ไปหาสีเดิมที่ alpha 0 (ไม่ใช้ transparent) ไม่งั้นจะไล่ผ่านดำโปร่งเกิดฝ้าขุ่น
          backgroundImage:
            'radial-gradient(circle at 50% 42%, rgba(124,92,190,0.26), rgba(124,92,190,0) 58%), radial-gradient(circle at 88% 6%, rgba(250,204,21,0.14), rgba(250,204,21,0) 42%), radial-gradient(circle at 8% 94%, rgba(250,204,21,0.10), rgba(250,204,21,0) 45%)',
          fontFamily: 'Prompt',
          padding: 56,
        }}
      >
        {/* โลโก้ KeyRush (กล่องเหลืองเอียง + ชื่อ) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 26 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 66,
              height: 66,
              borderRadius: 20,
              backgroundColor: '#facc15',
              transform: 'rotate(-6deg)',
              color: '#1E1B2E',
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            {T.logo}
          </div>
          <div style={{ display: 'flex', fontSize: 46, fontWeight: 700, color: '#facc15' }}>{T.brand}</div>
        </div>

        {/* ป้ายเล็ก "ระบบฝึกพิมพ์คำสั่ง" */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 30px',
            borderRadius: 999,
            backgroundColor: '#2D223B',
            border: '3px solid #4B3965',
            color: '#facc15',
            fontSize: 26,
            fontWeight: 700,
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', width: 13, height: 13, borderRadius: 13, backgroundColor: '#facc15' }} />
          {T.badge}
        </div>

        {/* หัวข้อหลัก 2 บรรทัด */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontSize: 92,
            fontWeight: 700,
            lineHeight: 1.12,
            letterSpacing: -2,
            textShadow: '3px 3px 0px rgba(0,0,0,0.35)',
          }}
        >
          <div style={{ display: 'flex', color: '#ffffff' }}>{T.line1}</div>
          <div style={{ display: 'flex', color: '#facc15' }}>{T.line2}</div>
        </div>

        {/* คำโปรย */}
        <div
          style={{
            display: 'flex',
            marginTop: 22,
            fontSize: 27,
            fontWeight: 400,
            color: 'rgba(255,255,255,0.72)',
            textAlign: 'center',
          }}
        >
          {T.sub}
        </div>

        {/* ปุ่ม 3D แบบเดียวกับหน้าเว็บ (ธีมมืด) */}
        <div style={{ display: 'flex', gap: 22, marginTop: 40 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '20px 44px',
              borderRadius: 30,
              backgroundColor: '#facc15',
              border: '4px solid #ca8a04',
              boxShadow: '0 8px 0 #ca8a04',
              color: '#1E1B2E',
              fontSize: 29,
              fontWeight: 700,
            }}
          >
            {/* ไอคอนเล่น (สามเหลี่ยม) */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#1E1B2E">
              <polygon points="5,3 21,12 5,21" />
            </svg>
            {T.cta1}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '20px 44px',
              borderRadius: 30,
              backgroundColor: '#2D223B',
              border: '4px solid #4B3965',
              boxShadow: '0 8px 0 #1E1B2E',
              color: '#facc15',
              fontSize: 29,
              fontWeight: 700,
            }}
          >
            {T.cta2}
          </div>
        </div>
      </div>
    ),
    { ...size, ...(fonts.length > 0 ? { fonts } : {}) }
  );
}
