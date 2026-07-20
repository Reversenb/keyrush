// 🖼️ กรอบรูปโปรไฟล์ — แปลง frameId จาก backend เป็นชื่อคลาส CSS
// คลาสจริงอยู่ใน app/globals.css (.kr-frame-<id>)
// frameId มาจาก src/shop/items.ts ฝั่ง backend

// รายชื่อกรอบที่มีจริง — กันกรณี backend ส่ง id แปลกๆ มาแล้วได้คลาสมั่วๆ ติดไปกับ element
const VALID_FRAMES = [
  // วงแหวนสีเดียว
  'silver', 'gold', 'neon', 'sakura',
  'bronze', 'rose', 'mint', 'sky', 'violet', 'crimson',
  // ไล่สีหมุน
  'fire', 'diamond', 'rainbow',
  'emerald', 'ocean', 'sunset', 'amethyst',
  // ไล่สี + แสงเต้น
  'venom', 'galaxy', 'phoenix', 'aurora',
  // ระดับตำนาน
  'eclipse', 'dragon', 'void',
] as const;

export type FrameId = (typeof VALID_FRAMES)[number];

/** คืนคลาสกรอบสำหรับใส่ใน className — ถ้าไม่มีกรอบ/ไม่รู้จัก คืนค่าว่าง */
export function frameClass(frameId?: string | null): string {
  if (!frameId) return '';
  return (VALID_FRAMES as readonly string[]).includes(frameId) ? `kr-frame-${frameId}` : '';
}
