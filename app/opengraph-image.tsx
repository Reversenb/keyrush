import { ImageResponse } from 'next/og';

// 🖼️ รูป Banner ที่ขึ้นตอนแชร์ลิงก์ (Open Graph / Twitter Card)
// Next.js จะ gen เป็น PNG อัตโนมัติที่ /opengraph-image และฝัง <meta og:image> ให้เอง
export const runtime = 'edge';
export const alt = 'KeyRush — เกมฝึกพิมพ์คำสั่ง Terminal';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b0b0f 0%, #171226 55%, #241016 100%)',
          padding: '72px',
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        {/* วงกลมเรืองแสงมุมจอ ให้มีมิติ */}
        <div style={{ position: 'absolute', top: -160, right: -120, width: 420, height: 420, borderRadius: 420, background: 'rgba(249,115,22,0.22)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -180, left: -100, width: 380, height: 380, borderRadius: 380, background: 'rgba(34,197,94,0.16)', display: 'flex' }} />

        {/* ป้ายเล็กบนสุด */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
          <div style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, background: 'rgba(249,115,22,0.16)', border: '2px solid rgba(249,115,22,0.5)', color: '#fdba74', fontSize: 26, fontWeight: 700, letterSpacing: 4 }}>
            TYPING GAME
          </div>
        </div>

        {/* ชื่อเกม */}
        <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>
          <span style={{ color: '#ffffff' }}>Key</span>
          <span style={{ color: '#fb923c' }}>Rush</span>
        </div>

        {/* คำโปรย */}
        <div style={{ display: 'flex', marginTop: 26, fontSize: 40, color: '#cbd5e1', fontWeight: 500 }}>
          Learn terminal commands by playing.
        </div>

        {/* แถบ terminal จำลอง */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 48, padding: '24px 34px', borderRadius: 22, background: 'rgba(0,0,0,0.5)', border: '2px solid rgba(255,255,255,0.12)', width: 780 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: 18, background: '#ff5f56', display: 'flex' }} />
            <div style={{ width: 18, height: 18, borderRadius: 18, background: '#ffbd2e', display: 'flex' }} />
            <div style={{ width: 18, height: 18, borderRadius: 18, background: '#27c93f', display: 'flex' }} />
          </div>
          <div style={{ display: 'flex', marginLeft: 18, fontSize: 34, fontWeight: 700 }}>
            <span style={{ color: '#4ade80' }}>$</span>
            <span style={{ color: '#e2e8f0', marginLeft: 16 }}>keyrush</span>
            <span style={{ color: '#fb923c', marginLeft: 16 }}>--play</span>
            <span style={{ color: '#4ade80', marginLeft: 8 }}>▋</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
