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
  { id: 2, title: 'Bronze', minExp: 200, icon: 'terminal', desc: 'ผ่านด่านแรกมาแล้ว เริ่มจำคำสั่งพื้นฐานได้และพิมพ์ได้คล่องขึ้น' },
  { id: 3, title: 'Gold', minExp: 500, icon: 'router', desc: 'ใช้คำสั่งได้หลากหลาย จัดการไฟล์และเครือข่ายเบื้องต้นได้สบายๆ' },
  { id: 4, title: 'Platinum', minExp: 1000, icon: 'dns', desc: 'ระดับมืออาชีพ ควบคุมเซิร์ฟเวอร์และโครงสร้างพื้นฐานได้อย่างชำนาญ' },
  { id: 5, title: 'Diamond', minExp: 2000, icon: 'bug_report', desc: 'ฝีมือระดับหัวกะทิ เชี่ยวชาญคำสั่งขั้นสูงและแก้ปัญหาซับซ้อนได้ไว' },
  { id: 6, title: 'Phantom', minExp: 3500, icon: 'fingerprint', desc: 'เงาไร้ร่องรอย พิมพ์เร็วแม่นจนแทบไม่มีใครตามทัน' },
  { id: 7, title: 'Root Master', minExp: 5000, icon: 'admin_panel_settings', desc: 'จุดสูงสุดของห่วงโซ่ รูทได้ทุกเซิร์ฟเวอร์ ควบคุมทุกเครือข่ายบนโลกอินเทอร์เน็ต' },
  { id: 8, title: 'Keyrush Master', minExp: 10000, icon: 'master', desc: 'ตำนานแห่ง KeyRush ผู้พิชิตทุกคำสั่งและทุกโหมด — มีเพียงไม่กี่คนที่ไปถึงจุดนี้' },
];

// หาแรงค์ปัจจุบันจาก EXP รวม (linux + windows)
export const getRankByExp = (totalExp: number): RankInfo =>
  [...RANKS].reverse().find(r => totalExp >= r.minExp) || RANKS[0];
