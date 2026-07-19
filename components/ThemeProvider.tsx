"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// 🌟 ทริคหลบ Error ของ React 19 
const Provider = NextThemesProvider as any;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        // 🚀 ให้ Provider ครอบไปเลยตั้งแต่แรก ไม่ต้องรอ mounted
        // ป้องกันอาการ xterm.js และหน้าเว็บโดนลบแล้วสร้างใหม่จนคอมค้าง
        <Provider
            attribute="class"
            defaultTheme="light"
            enableSystem={false}
            /* ธีมพื้นฐาน 3 + ธีมพรีเมียมที่ซื้อจากร้าน (โผล่ใน Navbar เมื่อเป็นเจ้าของ) */
            themes={['light', 'dark', 'hacker', 'sakura', 'dragon', 'sky']}
        >
            {children}
        </Provider>
    );
}