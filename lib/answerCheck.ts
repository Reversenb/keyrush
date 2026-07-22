// ✅ กติกาตัวพิมพ์เล็ก/ใหญ่ตอนตรวจคำสั่ง — ต้องเหมือนฝั่ง server เป๊ะ
// ต้นฉบับอยู่ที่ Keyrush-backend/src/lib/answerCheck.ts (แก้ที่ไหนต้องแก้อีกที่ด้วย)
//
// รับทั้งตัวเล็กและตัวใหญ่ทั้ง Linux และ Windows เพราะบนเครื่องที่ผู้เรียนใช้จริง
// (Git Bash / WSL บน /mnt/c, macOS APFS, Windows) ระบบไฟล์ไม่แยกตัวพิมพ์
// พิมพ์ MKDIR ก็ทำงานได้จริง — ดูเหตุผลเต็มในไฟล์ฝั่ง backend

export const isAnswerCorrect = (_os: string, userAnswer: string, expected: string): boolean =>
  userAnswer.trim().toLowerCase() === expected.trim().toLowerCase();
