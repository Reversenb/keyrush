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
            themes={['light', 'dark', 'hacker']} /* 🌟 เพิ่มตรงนี้เพื่อให้ระบบรู้จัก Hacker Mode 🌟 */
        >
            {children}
        </Provider>
    );
}