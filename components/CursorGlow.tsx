"use client";

// =========================================================================
// ✨ CursorGlow — เทรลดาวประกายตามเมาส์ สไตล์น่ารัก เข้ากับธีม
// (cute ส้ม-เหลือง-ชมพู / dark เหลืองทอง / hacker เขียวนีออน)
// - ดาว 4 แฉก ผุดตามเมาส์ แล้วลอยขึ้น หมุน ย่อ จางหาย
// - จุดนำนุ่มๆ ตามหลังแบบหน่วง ให้ฟีลมีมวล
// - pointer-events-none ไม่กวนคลิก | สร้าง/ลบ DOM ตรงๆ ไม่ trigger React re-render
// =========================================================================

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

// พาเลตต์ดาวแต่ละธีม (สุ่มสีต่อดวงให้มีชีวิตชีวา)
const PALETTES: Record<string, string[]> = {
  light: ['#fb923c', '#fbbf24', '#fb7185', '#f472b6'], // ส้ม เหลือง ชมพู
  dark: ['#facc15', '#fde047', '#fbbf24', '#fca5a5'],   // เหลืองทอง
  hacker: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0'], // เขียวนีออน
};

const STAR_PATH =
  'M12 0 C13.2 8 16 10.8 24 12 C16 13.2 13.2 16 12 24 C10.8 16 8 13.2 0 12 C8 10.8 10.8 8 12 0 Z';

export default function CursorGlow() {
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = (activeTheme === 'system' ? resolvedTheme : activeTheme) || 'light';

  const [mounted, setMounted] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  // อ่านธีมล่าสุดจาก ref ให้ event handler ใช้สีปัจจุบันเสมอ
  const themeRef = useRef(currentTheme);
  themeRef.current = currentTheme;

  const target = useRef({ x: 0, y: 0 });
  const dotPos = useRef({ x: 0, y: 0 });
  const started = useRef(false);
  const lastSpawn = useRef({ x: 0, y: 0, t: 0 });
  const raf = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    target.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    dotPos.current = { ...target.current };

    // สร้างดาวหนึ่งดวงแล้วปล่อยให้ลอยจางหาย
    const spawnStar = (x: number, y: number) => {
      const layer = layerRef.current;
      if (!layer) return;
      const palette = PALETTES[themeRef.current] || PALETTES.light;
      const color = palette[(Math.random() * palette.length) | 0];
      const size = 8 + Math.random() * 12;              // 8–20px
      const jitterX = (Math.random() - 0.5) * 24;
      const jitterY = (Math.random() - 0.5) * 24;
      const driftX = (Math.random() - 0.5) * 40;
      const driftY = -30 - Math.random() * 40;          // ลอยขึ้น
      const rot = (Math.random() - 0.5) * 220;

      const el = document.createElement('div');
      el.style.cssText = `position:absolute;left:${x + jitterX}px;top:${y + jitterY}px;width:${size}px;height:${size}px;will-change:transform,opacity;`;
      el.innerHTML =
        `<svg viewBox="0 0 24 24" width="${size}" height="${size}" style="display:block;filter:drop-shadow(0 0 4px ${color})"><path d="${STAR_PATH}" fill="${color}"/></svg>`;
      layer.appendChild(el);

      const anim = el.animate(
        [
          { transform: 'translate(-50%,-50%) scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'translate(-50%,-50%) scale(1) rotate(' + rot * 0.4 + 'deg)', opacity: 1, offset: 0.25 },
          { transform: `translate(calc(-50% + ${driftX}px),calc(-50% + ${driftY}px)) scale(0.2) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: 700 + Math.random() * 400, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
      anim.onfinish = () => el.remove();
    };

    const onMove = (e: MouseEvent) => {
      started.current = true;
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (dotRef.current) dotRef.current.style.opacity = '1';

      // สร้างดาวเมื่อขยับไกลพอ (คุมความถี่ให้ไม่รกและไม่กินแรง)
      const dx = e.clientX - lastSpawn.current.x;
      const dy = e.clientY - lastSpawn.current.y;
      const now = performance.now();
      if (dx * dx + dy * dy > 100 && now - lastSpawn.current.t > 24) {
        spawnStar(e.clientX, e.clientY);
        lastSpawn.current = { x: e.clientX, y: e.clientY, t: now };
      }
    };

    const tick = () => {
      if (started.current && dotRef.current) {
        dotPos.current.x += (target.current.x - dotPos.current.x) * 0.2;
        dotPos.current.y += (target.current.y - dotPos.current.y) * 0.2;
        dotRef.current.style.transform = `translate(-50%,-50%) translate(${dotPos.current.x}px, ${dotPos.current.y}px)`;
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [mounted]);

  if (!mounted) return null;

  const isHacker = currentTheme === 'hacker';
  const isDark = currentTheme === 'dark';
  const dotColor = isHacker ? '#4ade80' : isDark ? '#facc15' : '#fb923c';
  const dotShadow = isHacker ? 'rgba(74,222,128,0.7)' : isDark ? 'rgba(250,204,21,0.6)' : 'rgba(251,146,60,0.55)';

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden" aria-hidden>
      {/* ชั้นดาวประกาย */}
      <div ref={layerRef} className="absolute inset-0" />
      {/* จุดนำนุ่มๆ ตามหลัง */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 h-4 w-4 rounded-full will-change-transform"
        style={{
          transform: 'translate(-50%,-50%) translate(50vw, 50vh)',
          opacity: 0,
          background: `radial-gradient(circle, ${dotColor} 0%, transparent 70%)`,
          boxShadow: `0 0 14px 4px ${dotShadow}`,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  );
}
