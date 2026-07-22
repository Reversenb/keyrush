// =========================================================================
// ⚙️ ค่าตั้งค่าที่จำไว้ในเครื่องผู้เล่น (localStorage)
//
// ใช้ร่วมกันระหว่างหน้า Campaign / Training / Survival — ปรับที่หน้าไหนก็จำเหมือนกันหมด
// ⚠️ ทุกฟังก์ชันต้องกัน SSR (typeof window) เพราะ Next.js render ฝั่ง server ก่อน
//    และห่อ try/catch เผื่อเบราว์เซอร์ปิด localStorage ไว้ (โหมดส่วนตัวบางตัว)
// =========================================================================

const KEY_TERMINAL = 'keyrush_terminal_prefs';
const KEY_SURVIVAL_KB = 'keyrush_survival_keyboard';

export interface TerminalPrefs {
  color: string;
  size: number;
  bg: string;
  /** true = ผู้เล่นเลือกสี/พื้นหลังเองแล้ว → หยุดให้ธีมเว็บมาบังคับสีทับ
   *  (ค่าเริ่มต้น false = สีเทอร์มินัลเปลี่ยนตามธีมเว็บอัตโนมัติเหมือนเดิม) */
  custom: boolean;
}

/** ค่าเริ่มต้นตอนยังไม่เคยตั้งอะไร — ตรงกับของเดิมก่อนมีระบบจำค่า */
export const DEFAULT_TERMINAL_PREFS: TerminalPrefs = {
  color: 'orange',
  size: 15,
  bg: '#050505',
  custom: false,
};

/** อ่านค่าเทอร์มินัลที่เคยตั้งไว้ (ใช้เป็น lazy initializer ของ useState ได้เลย) */
export const loadTerminalPrefs = (): TerminalPrefs => {
  if (typeof window === 'undefined') return DEFAULT_TERMINAL_PREFS;
  try {
    const raw = localStorage.getItem(KEY_TERMINAL);
    if (!raw) return DEFAULT_TERMINAL_PREFS;
    const saved = JSON.parse(raw);
    // เช็คชนิดข้อมูลทีละตัว — ค่าที่เพี้ยน (เช่นแก้มือใน devtools) จะตกไปใช้ค่าเริ่มต้นแทน
    return {
      color: typeof saved.color === 'string' ? saved.color : DEFAULT_TERMINAL_PREFS.color,
      size: typeof saved.size === 'number' ? saved.size : DEFAULT_TERMINAL_PREFS.size,
      bg: typeof saved.bg === 'string' ? saved.bg : DEFAULT_TERMINAL_PREFS.bg,
      custom: saved.custom === true,
    };
  } catch {
    return DEFAULT_TERMINAL_PREFS;
  }
};

/** เซฟค่าเทอร์มินัลทับของเดิม */
export const saveTerminalPrefs = (prefs: TerminalPrefs): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_TERMINAL, JSON.stringify(prefs));
  } catch { }
};

/** แป้นพิมพ์ช่วยในโหมด Survival — ค่าเริ่มต้นคือปิด (ให้ผู้เล่นกดเปิดเอง) */
export const loadSurvivalKeyboard = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(KEY_SURVIVAL_KB) === 'true';
  } catch {
    return false;
  }
};

export const saveSurvivalKeyboard = (show: boolean): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(KEY_SURVIVAL_KB, String(show));
  } catch { }
};
