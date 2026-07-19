// ✨ เอฟเฟกต์แถว Leaderboard — แปลง rowId จาก backend เป็นชื่อคลาส CSS
// คลาสจริงอยู่ใน app/globals.css (.kr-row-<id>) และ rowId มาจาก src/shop/items.ts ฝั่ง backend

// กันกรณี backend ส่ง id แปลกๆ มาแล้วได้คลาสมั่วๆ ติดไปกับ element
const VALID_ROWS = ['ember', 'frost', 'thunder', 'gold', 'matrix', 'inferno', 'prism', 'sakura', 'ocean', 'void', 'galaxy', 'glitch'] as const;

export type RowEffectId = (typeof VALID_ROWS)[number];

/** คืนคลาสเอฟเฟกต์แถวสำหรับใส่ใน className — ถ้าไม่มี/ไม่รู้จัก คืนค่าว่าง */
export function rowEffectClass(rowId?: string | null): string {
  if (!rowId) return '';
  return (VALID_ROWS as readonly string[]).includes(rowId) ? `kr-row-${rowId}` : '';
}
