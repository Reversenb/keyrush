// =========================================================================
// 🌟 ข้อมูลแรงค์กลางของ KeyRush (คำนวณจาก EXP รวม)
// แก้ชื่อแรงค์/เกณฑ์ EXP/คำอธิบาย ที่ไฟล์นี้ไฟล์เดียว — มีผลทุกหน้า
// (ranks, dashboard, docs, โปรไฟล์สาธารณะ) ส่วนสีสันของแต่ละหน้าอยู่ที่หน้านั้นๆ
// =========================================================================

export interface RankInfo {
  id: number;
  title: string;
  minExp: number;
  // ชื่อไอคอน (Material Symbols) ที่หน้า ranks/dashboard ใช้ map เป็นคอมโพเนนต์
  icon: string;
  desc: string;
}

export const RANKS: RankInfo[] = [
  { id: 1, title: 'Rookie', minExp: 0, icon: 'keyboard', desc: 'มือใหม่ในโลกไซเบอร์ เพิ่งเริ่มเรียนรู้คำสั่งและเครื่องมือพื้นฐาน' },
  { id: 2, title: 'Cyber Novice', minExp: 200, icon: 'terminal', desc: 'เริ่มเข้าใจระบบ สามารถเขียนสคริปต์และเจาะระบบระดับเบื้องต้นได้' },
  { id: 3, title: 'Net Runner', minExp: 500, icon: 'router', desc: 'นักวิ่งข้ามเครือข่าย สามารถหลบหลีกไฟร์วอลล์และจัดการเน็ตเวิร์กเบื้องต้นได้' },
  { id: 4, title: 'System Admin', minExp: 1000, icon: 'dns', desc: 'ผู้ดูแลระบบ มีอำนาจควบคุมเซิร์ฟเวอร์และโครงสร้างพื้นฐานได้อย่างชำนาญ' },
  { id: 5, title: 'Elite Operative', minExp: 2000, icon: 'bug_report', desc: 'สายลับไซเบอร์ระดับสูง เชี่ยวชาญการค้นหาช่องโหว่และทะลวงระบบที่ซับซ้อน' },
  { id: 6, title: 'Phantom Architect', minExp: 3500, icon: 'fingerprint', desc: 'สถาปนิกไร้เงา ผู้ค้นพบและใช้งาน Zero-Day Exploit เข้าออกระบบโดยไม่ทิ้งร่องรอย' },
  { id: 7, title: 'Root Master', minExp: 5000, icon: 'admin_panel_settings', desc: 'จุดสูงสุดของห่วงโซ่ รูทได้ทุกเซิร์ฟเวอร์ ควบคุมทุกเครือข่ายบนโลกอินเทอร์เน็ต' },
];

// หาแรงค์ปัจจุบันจาก EXP รวม (linux + windows)
export const getRankByExp = (totalExp: number): RankInfo =>
  [...RANKS].reverse().find(r => totalExp >= r.minExp) || RANKS[0];
