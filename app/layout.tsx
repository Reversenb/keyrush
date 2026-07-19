import type { Metadata } from "next";
import { Prompt, Baloo_2 } from "next/font/google";
import "./globals.css";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { ThemeProvider } from "@/components/ThemeProvider"; // 🌟 1. นำเข้า ThemeProvider
import CursorGlow from "@/components/CursorGlow"; // ✨ แสงเรืองตามเมาส์ตามธีม

// 🌸 ตั้งค่าฟอนต์ภาษาไทย (Prompt) ให้อ่านง่าย สบายตา
const prompt = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-prompt",
  display: "swap",
});

// 🌸 ตั้งค่าฟอนต์น่ารักๆ สำหรับตัวเลขและภาษาอังกฤษ (Baloo 2)
const baloo = Baloo_2({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-baloo",
  display: "swap",
});

export const metadata: Metadata = {
  // ⚓ ฐาน URL ของเว็บจริง — ทำให้ลิงก์รูป og:image เป็น absolute (โซเชียล/แชทต้องการ URL เต็ม)
  metadataBase: new URL("https://keyrush-swart.vercel.app"),
  title: "KeyRush — เกมฝึกพิมพ์คำสั่ง Terminal",
  description: "ฝึกพิมพ์คำสั่ง Linux/Windows อย่างสนุก เก็บ EXP ไต่แรงค์ แข่ง Leaderboard — Learn terminal commands by playing.",
  // 🖼️ เวลาแชร์ลิงก์ให้ขึ้น banner + ชื่อ + คำโปรย (Next auto-ใส่ og:image จาก opengraph-image.tsx)
  openGraph: {
    title: "KeyRush — เกมฝึกพิมพ์คำสั่ง Terminal",
    description: "ฝึกพิมพ์คำสั่ง Linux/Windows อย่างสนุก เก็บ EXP ไต่แรงค์ แข่ง Leaderboard",
    url: "https://keyrush-swart.vercel.app",
    siteName: "KeyRush",
    locale: "th_TH",
    type: "website",
  },
  twitter: {
    card: "summary_large_image", // การ์ดรูปใหญ่เต็มความกว้าง
    title: "KeyRush — เกมฝึกพิมพ์คำสั่ง Terminal",
    description: "ฝึกพิมพ์คำสั่ง Linux/Windows อย่างสนุก เก็บ EXP ไต่แรงค์ แข่ง Leaderboard",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 🌟 ดึงค่า Client ID สำหรับ Google Login
  const googleClientId = "670116826366-56ac2m6ql18arvlakp1vgu7v565e6b18.apps.googleusercontent.com";

  return (
    // 🌟 2. เพิ่ม suppressHydrationWarning เพื่อป้องกัน Error ตอนโหลดธีม
    <html lang="th" className={`${prompt.variable} ${baloo.variable}`} suppressHydrationWarning>
      <head>
        {/* เปิด connection ไป dicebear ล่วงหน้า — avatar โหลดไวขึ้นตั้งแต่รูปแรก */}
        <link rel="preconnect" href="https://api.dicebear.com" />
        {/* ไอคอน Material Symbols */}
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      {/* 🌟 3. เปลี่ยนสีพื้นหลังตายตัว เป็นตัวแปร bg-background และ text-foreground + ใส่ effect เฟดสี */}
      <body className="font-sans bg-background text-foreground transition-colors duration-500 antialiased selection:bg-pink-200">
        <GoogleOAuthProvider clientId={googleClientId}>
          {/* 🌟 4. เอา ThemeProvider มาครอบแอปพลิเคชันทั้งหมด */}
          <ThemeProvider>
            {children}
            {/* ✨ แสงเรืองตามเมาส์ (เฉพาะเครื่องที่มีเมาส์จริง) */}
            <CursorGlow />
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}