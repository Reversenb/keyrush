"use client";

// =========================================================================
// ✨ CursorGlow — เอฟเฟกต์ตามเมาส์ (สินค้าจากร้านค้า — ค่าเริ่มต้นไม่มีเอฟเฟกต์)
// - จุดนำเปลี่ยนตามเอฟเฟกต์ที่ใส่: ดาว SVG (เปลี่ยนสีตามธีม) / 🔥 / 💗 / 🫧 / ❄️
// - เทรลอนุภาคแบบเดียวกับจุดนำ: ป็อป → ลอย → หมุน → จางหาย (หิมะร่วงลง)
// - อ่านเอฟเฟกต์จาก keyrush_user.activeCursor + อัปเดตสดผ่าน event 'keyrush-user-updated'
// - pointer-events-none ไม่กวนคลิก | สร้าง/ลบ DOM ตรงๆ ไม่ trigger React re-render
// =========================================================================

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

// พาเลตต์ดาวแต่ละธีม (ใช้กับเอฟเฟกต์ 'stars' — สุ่มสีต่อดวงให้มีชีวิตชีวา)
const PALETTES: Record<string, string[]> = {
  light: ['#fb923c', '#fbbf24', '#fb7185', '#f472b6'], // ส้ม เหลือง ชมพู
  dark: ['#facc15', '#fde047', '#fbbf24', '#fca5a5'],   // เหลืองทอง
  hacker: ['#22c55e', '#4ade80', '#86efac', '#bbf7d0'], // เขียวนีออน
  sakura: ['#f472b6', '#fb7185', '#fda4af', '#fbcfe8'], // ชมพูหวาน
  dragon: ['#ef4444', '#f87171', '#fca5a5', '#fecaca'], // แดงเพลิง
};

// 🛍️ เอฟเฟกต์จากร้านค้า — id ต้องตรงกับ cursorId ในแคตตาล็อก backend
// driftY ติดลบ = ลอยขึ้น / บวก = ร่วงลง | lead = อีโมจิจุดนำ ('' = ใช้ดาว SVG)
// glow = สีเรืองแสงประจำเอฟเฟกต์ (แบบเดียวกับที่ทำให้ดาวสวย)
const CURSOR_EFFECTS: Record<string, { emojis: string[]; driftY: [number, number]; lead: string; glow: string }> = {
  stars: { emojis: [], driftY: [-70, -35], lead: '', glow: '' },
  hearts: { emojis: ['💗', '💕', '💘'], driftY: [-70, -35], lead: '💗', glow: 'rgba(244,114,182,0.85)' },
  bubbles: { emojis: ['🫧'], driftY: [-80, -45], lead: '🫧', glow: 'rgba(125,211,252,0.85)' },
  fire: { emojis: ['🔥', '✨'], driftY: [-90, -55], lead: '🔥', glow: 'rgba(249,115,22,0.9)' },
  snow: { emojis: ['❄️', '✳️'], driftY: [35, 70], lead: '❄️', glow: 'rgba(186,230,253,0.95)' },
  // ระดับพรีเมียม
  butterfly: { emojis: ['🦋', '🌸', '🌺'], driftY: [-75, -40], lead: '🦋', glow: 'rgba(96,165,250,0.85)' },
  thunder: { emojis: ['⚡', '✨'], driftY: [-100, -60], lead: '⚡', glow: 'rgba(250,204,21,0.95)' },
  rainbow: { emojis: ['🌈', '⭐', '✨'], driftY: [-70, -35], lead: '🌈', glow: 'rgba(192,132,252,0.9)' },
  galaxy: { emojis: ['🪐', '🌟', '💫', '🌙'], driftY: [-80, -45], lead: '🪐', glow: 'rgba(167,139,250,0.9)' },
  royal: { emojis: ['👑', '💎', '✨'], driftY: [-70, -35], lead: '👑', glow: 'rgba(250,204,21,0.95)' },
  dragonsoul: { emojis: ['🐉', '🔥', '💥'], driftY: [-90, -50], lead: '🐉', glow: 'rgba(239,68,68,0.9)' },
};

const STAR_PATH =
  'M12 0 C13.2 8 16 10.8 24 12 C16 13.2 13.2 16 12 24 C10.8 16 8 13.2 0 12 C8 10.8 10.8 8 12 0 Z';

export default function CursorGlow() {
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = (activeTheme === 'system' ? resolvedTheme : activeTheme) || 'light';

  const [mounted, setMounted] = useState(false);
  // เอฟเฟกต์ที่ใส่อยู่ (null = ไม่แสดงอะไรเลย) — เก็บทั้ง state (ไว้ render จุดนำ) และ ref (ให้ handler อ่านค่าสด)
  const [effect, setEffect] = useState<string | null>(null);
  const effectRef = useRef<string | null>(null);

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

  // 🛍️ ซิงก์เอฟเฟกต์จาก localStorage + อัปเดตสดตอนกดใส่/ถอดในร้าน
  useEffect(() => {
    const readEffect = () => {
      try {
        const u = JSON.parse(localStorage.getItem('keyrush_user') || 'null');
        const id = u?.activeCursor && CURSOR_EFFECTS[u.activeCursor] ? u.activeCursor : null;
        effectRef.current = id;
        setEffect(id);
      } catch {
        effectRef.current = null;
        setEffect(null);
      }
    };
    readEffect();
    window.addEventListener('keyrush-user-updated', readEffect);
    return () => window.removeEventListener('keyrush-user-updated', readEffect);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    target.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    dotPos.current = { ...target.current };

    // ⭐ อนุภาคดาว SVG (เอฟเฟกต์ 'stars') — สีตามธีมเว็บ
    const spawnStar = (x: number, y: number) => {
      const layer = layerRef.current;
      if (!layer) return;
      const palette = PALETTES[themeRef.current] || PALETTES.light;
      const color = palette[(Math.random() * palette.length) | 0];
      const size = 8 + Math.random() * 12;
      const jitterX = (Math.random() - 0.5) * 24;
      const jitterY = (Math.random() - 0.5) * 24;
      const driftX = (Math.random() - 0.5) * 40;
      const driftY = -30 - Math.random() * 40;
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

    // 🖱️ อนุภาคอีโมจิ (หัวใจ/ฟอง/ไฟ/หิมะ ฯลฯ) — เรืองแสงสีประจำเอฟเฟกต์แบบเดียวกับดาว
    const spawnEmoji = (x: number, y: number, fx: { emojis: string[]; driftY: [number, number]; glow: string }) => {
      const layer = layerRef.current;
      if (!layer) return;
      const emoji = fx.emojis[(Math.random() * fx.emojis.length) | 0];
      const size = 13 + Math.random() * 9;
      const jitterX = (Math.random() - 0.5) * 24;
      const jitterY = (Math.random() - 0.5) * 24;
      const driftX = (Math.random() - 0.5) * 44;
      const [dMin, dMax] = fx.driftY;
      const driftY = dMin + Math.random() * (dMax - dMin);
      const rot = (Math.random() - 0.5) * 160;

      const el = document.createElement('div');
      el.textContent = emoji;
      el.style.cssText = `position:absolute;left:${x + jitterX}px;top:${y + jitterY}px;font-size:${size}px;line-height:1;will-change:transform,opacity;filter:drop-shadow(0 0 5px ${fx.glow});`;
      layer.appendChild(el);

      const anim = el.animate(
        [
          { transform: 'translate(-50%,-50%) scale(0) rotate(0deg)', opacity: 0 },
          { transform: 'translate(-50%,-50%) scale(1) rotate(' + rot * 0.4 + 'deg)', opacity: 1, offset: 0.25 },
          { transform: `translate(calc(-50% + ${driftX}px),calc(-50% + ${driftY}px)) scale(0.3) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: 800 + Math.random() * 450, easing: 'cubic-bezier(0.22,1,0.36,1)' }
      );
      anim.onfinish = () => el.remove();
    };

    const onMove = (e: MouseEvent) => {
      started.current = true;
      target.current.x = e.clientX;
      target.current.y = e.clientY;
      if (dotRef.current) dotRef.current.style.opacity = '1';

      // ไม่ได้ใส่เอฟเฟกต์ = ไม่มีเทรล
      const id = effectRef.current;
      if (!id) return;

      // สร้างอนุภาคเมื่อขยับไกลพอ (คุมความถี่ให้ไม่รกและไม่กินแรง)
      const dx = e.clientX - lastSpawn.current.x;
      const dy = e.clientY - lastSpawn.current.y;
      const now = performance.now();
      if (dx * dx + dy * dy > 100 && now - lastSpawn.current.t > 24) {
        if (id === 'stars') spawnStar(e.clientX, e.clientY);
        else spawnEmoji(e.clientX, e.clientY, CURSOR_EFFECTS[id]);
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

  // ไม่ได้ใส่เอฟเฟกต์ = ไม่แสดงอะไรเลย (ค่าเริ่มต้นของผู้เล่นใหม่)
  if (!mounted || !effect) return null;

  const fx = CURSOR_EFFECTS[effect];
  const isStar = effect === 'stars';

  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon';
  const isDragon = currentTheme === 'dragon';
  const isDark = currentTheme === 'dark';
  const isSakura = currentTheme === 'sakura';
  const dotColor = isHacker ? (isDragon ? '#f87171' : '#4ade80') : isDark ? '#facc15' : isSakura ? '#f472b6' : '#fb923c';
  const dotShadow = isHacker ? (isDragon ? 'rgba(248,113,113,0.7)' : 'rgba(74,222,128,0.7)') : isDark ? 'rgba(250,204,21,0.6)' : isSakura ? 'rgba(244,114,182,0.6)' : 'rgba(251,146,60,0.55)';

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes kr-lead-spin { 0% { transform: rotate(0deg) scale(1); } 50% { transform: rotate(180deg) scale(1.18); } 100% { transform: rotate(360deg) scale(1); } }
        @keyframes kr-lead-pulse { 0%, 100% { transform: scale(1) rotate(-6deg); } 50% { transform: scale(1.25) rotate(6deg); } }
      `}</style>

      {/* ชั้นอนุภาคเทรล */}
      <div ref={layerRef} className="absolute inset-0" />

      {/* จุดนำตามเมาส์ — เปลี่ยนตามเอฟเฟกต์ที่ใส่ */}
      <div
        ref={dotRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{
          transform: 'translate(-50%,-50%) translate(50vw, 50vh)',
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        {isStar ? (
          <svg
            viewBox="0 0 24 24"
            width={26}
            height={26}
            style={{ display: 'block', filter: `drop-shadow(0 0 6px ${dotShadow})`, animation: 'kr-lead-spin 4s ease-in-out infinite' }}
          >
            <path d={STAR_PATH} fill={dotColor} />
          </svg>
        ) : (
          <span
            style={{
              display: 'block',
              fontSize: 26,
              lineHeight: 1,
              animation: 'kr-lead-pulse 1.4s ease-in-out infinite',
              filter: `drop-shadow(0 0 8px ${fx.glow})`,
            }}
          >
            {fx.lead}
          </span>
        )}
      </div>
    </div>
  );
}
