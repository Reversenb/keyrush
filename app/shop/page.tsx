"use client";

// =========================================================================
// 🛍️ SHOP — ใช้เหรียญที่ได้จากการเล่นแลกของตกแต่ง
// - ฉายา (Title): โชว์ข้างชื่อบน Leaderboard / โปรไฟล์
// - ธีมเว็บ (Theme): เปลี่ยนสีทั้งเว็บ เลือกสลับได้จากปุ่มธีมใน Navbar
// ราคาและสิทธิ์ทั้งหมดตรวจฝั่ง server (client ส่งแค่ itemId)
// =========================================================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import { PageSkeleton, SkelGridCards, skCard, sk } from '@/components/skeleton';
import {
  ShoppingBag, Tag, Palette, Check, Lock, Sparkles, AlertCircle, Package, MousePointer2, X
} from 'lucide-react';
import CoinIcon from '@/components/CoinIcon';
import { apiFetch, clearUserState } from '@/lib/api';

interface ShopItem {
  id: string;
  type: 'title' | 'theme' | 'cursor';
  name: string;
  desc: string;
  price: number;
  label?: string;
  themeId?: string;
  preview?: [string, string, string]; // [พื้นหลัง, สีหลัก, สีรอง]
  cursorId?: string;
  emoji?: string;
}

export default function ShopPage() {
  const router = useRouter();

  const { theme: activeTheme, resolvedTheme, setTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker' || currentTheme === 'dragon'; const isDragon = currentTheme === 'dragon';

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [coins, setCoins] = useState(0);
  const [equippedTitle, setEquippedTitle] = useState<string | null>(null);
  const [equippedTheme, setEquippedTheme] = useState<string | null>(null);
  const [equippedCursor, setEquippedCursor] = useState<string | null>(null);
  const [tab, setTab] = useState<'title' | 'theme' | 'cursor'>('title');
  // 🏪 มุมมอง: ร้านค้า หรือ คลังของที่ซื้อแล้ว
  const [view, setView] = useState<'shop' | 'inventory'>('shop');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  // 🔍 ฉายาที่กดดูแบบขยาย (popup สไตล์เดียวกับหน้า Docs)
  const [selectedTitle, setSelectedTitle] = useState<ShopItem | null>(null);

  useEffect(() => setMounted(true), []);

  const showToast = (ok: boolean, msg: string) => {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 2600);
  };

  const loadShop = async () => {
    try {
      const res = await apiFetch('/api/shop');
      if (res.status === 401 || res.status === 403) {
        clearUserState();
        router.push('/login');
        return;
      }
      const data = await res.json();
      if (data.success && data.data) {
        setItems(data.data.items || []);
        setOwnedIds(data.data.ownedIds || []);
        setCoins(data.data.coins || 0);
        setEquippedTitle(data.data.equippedTitle ?? null);
        setEquippedTheme(data.data.equippedTheme ?? null);
        setEquippedCursor(data.data.equippedCursor ?? null);
      }
    } catch (e) {
      console.error('Load shop failed', e);
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  useEffect(() => {
    loadShop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleBuy = async (item: ShopItem) => {
    setBusyId(item.id);
    try {
      const res = await apiFetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id })
      });
      const data = await res.json();
      if (data.success) {
        setCoins(data.coins);
        setOwnedIds((prev) => [...prev, item.id]);
        showToast(true, data.message || 'ซื้อสำเร็จ!');
      } else {
        showToast(false, data.message || 'ซื้อไม่สำเร็จ');
      }
    } catch {
      showToast(false, 'เชื่อมต่อไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  const handleEquip = async (item: ShopItem, unequip = false) => {
    setBusyId(item.id);
    try {
      const url = unequip ? `/api/shop/equip?type=${item.type}` : '/api/shop/equip';
      const res = await apiFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: unequip ? '' : item.id })
      });
      const data = await res.json();
      if (data.success) {
        const next = unequip ? null : item.id;
        if (item.type === 'title') {
          setEquippedTitle(next);
        } else if (item.type === 'theme') {
          setEquippedTheme(next);
          // 🎨 ใส่ธีม = สลับไปธีมนั้นทันที / ถอด = กลับธีมสว่างมาตรฐาน
          setTheme(unequip ? 'light' : (item.themeId || 'light'));

          // 📣 อัปเดต cache + แจ้ง Navbar ให้วงจรสลับธีมเปลี่ยนทันที (ไม่ต้องรีเฟรช)
          try {
            const saved = localStorage.getItem('keyrush_user');
            if (saved) {
              const u = JSON.parse(saved);
              u.activeTheme = unequip ? null : (item.themeId ?? null);
              localStorage.setItem('keyrush_user', JSON.stringify(u));
            }
          } catch { }
          window.dispatchEvent(new Event('keyrush-user-updated'));
        } else {
          setEquippedCursor(next);
          // 🖱️ อัปเดต cache + แจ้ง CursorGlow ให้เปลี่ยนเทรลทันที (ไม่ต้องรีเฟรช)
          try {
            const saved = localStorage.getItem('keyrush_user');
            if (saved) {
              const u = JSON.parse(saved);
              u.activeCursor = unequip ? null : (item.cursorId ?? null);
              localStorage.setItem('keyrush_user', JSON.stringify(u));
            }
          } catch { }
          window.dispatchEvent(new Event('keyrush-user-updated'));
        }
        showToast(true, data.message || 'สำเร็จ');
      } else {
        showToast(false, data.message || 'ทำรายการไม่สำเร็จ');
      }
    } catch {
      showToast(false, 'เชื่อมต่อไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  };

  if (!mounted) return <div className="bg-background min-h-screen" />;
  if (loading) return (
    <PageSkeleton>
      {/* แบนเนอร์ร้านค้า: ซ้ายไอคอน+ชื่อร้าน / ขวากล่องเหรียญ+ปุ่มคลัง (โครงเดียวกับหน้าจริง) */}
      <div className={`${skCard} rounded-[32px] mb-4 md:mb-6 p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5`}>
        <div className="flex items-center gap-4 min-w-0">
          <div className={`${sk} rounded-[20px] md:rounded-[24px] size-16 md:size-20 shrink-0`} />
          <div className="flex flex-col gap-2.5 min-w-0">
            <div className={`${sk} rounded-full h-7 md:h-9 w-48 md:w-64 max-w-full`} />
            <div className={`${sk} rounded-full h-3.5 w-56 md:w-80 max-w-full`} />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className={`${sk} rounded-2xl h-14 md:h-16 w-40`} />
          <div className={`${sk} rounded-2xl h-12 md:h-13 w-32`} />
        </div>
      </div>
      {/* แถบแท็บหมวด (ฉายา/ธีมเว็บ/เอฟเฟกต์) — กล่องเดียว 3 ปุ่ม ไม่มีปุ่มฝั่งขวา */}
      <div className={`${skCard} rounded-[24px] md:rounded-[32px] p-2 md:p-3 flex gap-2 md:gap-3 w-full max-w-md mb-4 md:mb-6`}>
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className={`${sk} rounded-2xl h-10 md:h-11 flex-1`} />)}
      </div>
      {/* การ์ดสินค้า */}
      <SkelGridCards n={6} />
    </PageSkeleton>
  );

  // ใช้แท็บ (ฉายา/ธีมเว็บ) ชุดเดียวกันทั้งสองมุมมอง — คลังกรองเฉพาะของที่เป็นเจ้าของ
  const visible = items.filter((i) => i.type === tab);
  const invVisible = visible.filter((i) => ownedIds.includes(i.id));
  const ownedCountOf = (t: ShopItem['type']) => items.filter((i) => i.type === t && ownedIds.includes(i.id)).length;
  const equippedFor = (i: ShopItem) =>
    (i.type === 'title' ? equippedTitle : i.type === 'theme' ? equippedTheme : equippedCursor) === i.id;

  const tabBtn = (active: boolean) =>
    `flex-1 py-3 md:py-4 rounded-[16px] md:rounded-[20px] text-[10px] sm:text-xs md:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 border-4 btn-squishy transition-colors ${active
      ? isHacker
        ? 'bg-green-500 border-green-400 text-[#0a0a0a] shadow-[0_4px_0_#16a34a]'
        : isDark
          ? 'bg-yellow-400 border-yellow-300 text-[#1E1B2E] shadow-[0_4px_0_#ca8a04]'
          : 'bg-orange-500 border-orange-400 text-white shadow-[0_4px_0_#c2410c]'
      : isHacker
        ? 'bg-[#0a0a0a] border-green-900 text-green-700 shadow-[0_4px_0_#14532d] hover:text-green-400'
        : isDark
          ? 'bg-[#1E1B2E] border-[#382E54] text-white/40 shadow-[0_4px_0_#0a0a0a] hover:text-yellow-400'
          : 'bg-white border-orange-200 text-orange-400 shadow-[0_4px_0_#fed7aa] hover:text-orange-600'
    }`;

  return (
    <div className="bg-background font-sans font-black min-h-screen flex flex-col overflow-x-hidden text-foreground relative transition-colors duration-500">
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0) rotate(0deg);} 50% { transform: translateY(-15px) rotate(2deg);} }
        .float-element { animation: float 6s ease-in-out infinite; }
        .glass-card { background: rgba(255,255,255,0.9); backdrop-filter: blur(16px); border: 4px solid white; border-radius: 32px; transition: all .3s ease; }
        .dark .glass-card { background: rgba(45,34,59,0.7); border-color:#382E54; }
        .hacker .glass-card { background: rgba(10,10,10,0.85); border-color:#166534; }
        .btn-squishy { transition: all .1s cubic-bezier(.4,0,.2,1); }
        .btn-squishy:hover { transform: translateY(-2px); }
        .btn-squishy:active { transform: translateY(4px); box-shadow: 0 0 0 transparent !important; }
        .cute-header { text-shadow: 2px 2px 0 rgba(255,255,255,1), -1px -1px 0 rgba(255,255,255,1), 1px -1px 0 rgba(255,255,255,1), -1px 1px 0 rgba(255,255,255,1); letter-spacing:-.02em; }
        .dark .cute-header { text-shadow: 2px 2px 0 rgba(0,0,0,.4); }
        .hacker .cute-header { text-shadow: 2px 2px 0 rgba(0,0,0,.8); }
      `}</style>

      {/* 🎈 Blobs */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0 transition-colors" />
      <div className="fixed bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 pointer-events-none z-0 transition-colors" />

      <div className="relative z-50 shrink-0"><Navbar theme="linux" /></div>

      <main className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-4 md:px-8 py-6 md:py-10 relative z-10 flex flex-col gap-5 md:gap-7">

        {/* 🏪 Hero Banner: หัวร้าน + กระเป๋าเหรียญ + ปุ่มคลัง */}
        <div className="glass-card relative overflow-hidden p-5 md:p-8 shadow-sm">
          {/* ✨ ประกายตกแต่ง */}
          <Sparkles size={24} strokeWidth={3} className="absolute top-4 right-28 md:right-48 rotate-12 text-orange-300 dark:text-yellow-500/40 hacker:text-green-700 pointer-events-none" />
          <Sparkles size={15} strokeWidth={3} className="absolute bottom-4 left-[45%] -rotate-12 text-orange-200 dark:text-yellow-500/30 hacker:text-green-800 pointer-events-none" />
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-[70px] opacity-30 pointer-events-none bg-orange-300 dark:bg-yellow-500/40 hacker:bg-green-600/40 transition-colors" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 relative z-10">
            {/* ซ้าย: ป้ายร้าน */}
            <div className="flex items-center gap-4 md:gap-5 min-w-0">
              <div className="size-16 md:size-20 shrink-0 rounded-[20px] md:rounded-[24px] border-4 border-white dark:border-[#4B3965] hacker:border-green-700 bg-orange-100 dark:bg-yellow-400/10 hacker:bg-green-900/20 text-orange-500 dark:text-yellow-400 hacker:text-green-500 flex items-center justify-center -rotate-6 shadow-sm transition-colors">
                <ShoppingBag className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-orange-950 dark:text-white hacker:text-white cute-header leading-none">
                  KeyRush <span className="text-orange-500 dark:text-yellow-400 hacker:text-green-500">Shop</span>
                </h1>
                <p className="mt-1.5 md:mt-2 text-[11px] md:text-sm font-bold text-orange-500 dark:text-yellow-500 hacker:text-green-600">
                  ใช้เหรียญที่ได้จากการเล่น แลกของตกแต่งสุดเท่ ✨
                </p>
              </div>
            </div>

            {/* ขวา: เหรียญ + ปุ่มคลัง */}
            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              <div className="flex items-center gap-3 px-4 py-2.5 md:px-5 md:py-3 rounded-2xl border-4 bg-white dark:bg-[#2D223B] hacker:bg-[#0a0a0a] border-orange-100 dark:border-[#4B3965] hacker:border-green-800 shadow-sm transition-colors">
                <div className="size-9 md:size-10 rounded-xl flex items-center justify-center shadow-sm bg-amber-400 dark:bg-yellow-400 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a]">
                  <CoinIcon size={22} />
                </div>
                <div>
                  <p className="text-[8px] md:text-[9px] uppercase tracking-widest opacity-50 leading-none">เหรียญของคุณ</p>
                  <p className="text-xl md:text-2xl font-black cute-header tabular-nums text-amber-500 dark:text-yellow-400 hacker:text-green-400 leading-tight">
                    {coins.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* 📦 ปุ่มสลับ ร้านค้า ↔ คลังของฉัน */}
              <button
                onClick={() => setView(view === 'inventory' ? 'shop' : 'inventory')}
                className="btn-squishy relative flex items-center gap-2 px-4 py-3 md:px-5 md:py-3.5 rounded-2xl border-4 font-black text-[11px] md:text-xs uppercase tracking-widest transition-colors bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-white dark:border-yellow-300 hacker:border-green-400 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] shadow-[0_4px_0_#c2410c] dark:shadow-[0_4px_0_#ca8a04] hacker:shadow-[0_4px_0_#14532d]"
              >
                {view === 'inventory' ? <ShoppingBag size={16} strokeWidth={3} /> : <Package size={16} strokeWidth={3} />}
                {view === 'inventory' ? 'กลับร้านค้า' : 'คลังของฉัน'}
                {view === 'shop' && ownedIds.length > 0 && (
                  <span className="absolute -top-2.5 -right-2.5 min-w-6 h-6 px-1.5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white bg-rose-500 text-white shadow-sm">
                    {ownedIds.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* หัวข้อคลัง (เฉพาะโหมดคลัง) */}
        {view === 'inventory' && (
          <div className="flex items-center gap-3">
            <div className="size-10 md:size-11 rounded-2xl border-4 border-white dark:border-[#4B3965] hacker:border-green-700 bg-orange-100 dark:bg-yellow-400/10 hacker:bg-green-900/20 text-orange-500 dark:text-yellow-400 hacker:text-green-500 flex items-center justify-center shadow-sm">
              <Package size={20} strokeWidth={3} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase text-orange-950 dark:text-white hacker:text-white cute-header leading-none">คลังของฉัน</h2>
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-orange-400 dark:text-white/40 hacker:text-green-700 mt-1">ของที่ซื้อแล้ว {ownedIds.length} ชิ้น — กดใส่ / ถอดได้เลย</p>
            </div>
          </div>
        )}

        {/* แท็บประเภทของ — ใช้ชุดเดียวกันทั้งร้านและคลัง (กดสลับ ไม่ต้องเลื่อน) */}
        <div className="bg-white/80 dark:bg-[#1E1B2E]/80 hacker:bg-[#0a0a0a]/80 backdrop-blur-md p-2 md:p-3 rounded-[24px] md:rounded-[32px] border-4 border-white dark:border-[#382E54] hacker:border-[#166534] flex gap-2 md:gap-3 w-full max-w-md">
          <button onClick={() => setTab('title')} className={tabBtn(tab === 'title')}>
            <Tag size={16} strokeWidth={3} /> ฉายา
            {view === 'inventory' && <span className="ml-0.5 opacity-70">({ownedCountOf('title')})</span>}
          </button>
          <button onClick={() => setTab('theme')} className={tabBtn(tab === 'theme')}>
            <Palette size={16} strokeWidth={3} /> ธีมเว็บ
            {view === 'inventory' && <span className="ml-0.5 opacity-70">({ownedCountOf('theme')})</span>}
          </button>
          <button onClick={() => setTab('cursor')} className={tabBtn(tab === 'cursor')}>
            <MousePointer2 size={16} strokeWidth={3} /> เอฟเฟกต์
            {view === 'inventory' && <span className="ml-0.5 opacity-70">({ownedCountOf('cursor')})</span>}
          </button>
        </div>

        {/* รายการสินค้า — grid เดียว กรองตามแท็บทั้งสองมุมมอง */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 pb-10">
          {/* 📦 คลังหมวดนี้ยังว่าง */}
          {view === 'inventory' && invVisible.length === 0 && (
            <div className="col-span-full glass-card p-10 md:p-14 text-center flex flex-col items-center gap-3 shadow-sm">
              <Package size={52} strokeWidth={2.5} className="opacity-30 animate-bounce text-orange-400 dark:text-yellow-400 hacker:text-green-600" />
              <p className="font-black uppercase tracking-widest text-sm text-orange-400 dark:text-white/40 hacker:text-green-700">
                ยังไม่มี{tab === 'title' ? 'ฉายา' : tab === 'theme' ? 'ธีมเว็บ' : 'เอฟเฟกต์เมาส์'}ในคลังเลย
              </p>
              <button
                onClick={() => setView('shop')}
                className="btn-squishy mt-2 px-6 py-3 rounded-2xl border-4 font-black text-xs uppercase tracking-widest bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-white dark:border-yellow-300 hacker:border-green-400 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] shadow-[0_4px_0_#c2410c] dark:shadow-[0_4px_0_#ca8a04] hacker:shadow-[0_4px_0_#14532d]"
              >
                <span className="flex items-center gap-2"><ShoppingBag size={14} strokeWidth={3} /> ไปช้อปกันเลย!</span>
              </button>
            </div>
          )}

          {(view === 'inventory' ? invVisible : visible).map(renderCard)}
        </div>
      </main>

      {/* 🔍 Popup ขยายฉายา — สไตล์เดียวกับหน้า Docs อ่านง่ายเต็มตา */}
      <AnimatePresence>
        {selectedTitle && (() => {
          const owned = ownedIds.includes(selectedTitle.id);
          const equipped = equippedFor(selectedTitle);
          const canAfford = coins >= selectedTitle.price;
          const busy = busyId === selectedTitle.id;
          return (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedTitle(null)}
                className={`fixed inset-0 backdrop-blur-md ${isHacker ? 'bg-black/80' : isDark ? 'bg-black/70' : 'bg-orange-950/40'}`}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className={`relative w-full max-w-2xl border-4 rounded-[32px] shadow-2xl flex flex-col z-10 ${isHacker ? 'bg-[#0a0a0a] border-green-500' : isDark ? 'bg-[#1E1B2E] border-yellow-400' : 'bg-white border-orange-400'}`}
              >
                <div className="p-8 md:p-10 space-y-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <span className={`text-xs font-black uppercase tracking-widest mb-3 flex items-center gap-2 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>
                        <Tag size={14} strokeWidth={3} /> ฉายา · {selectedTitle.name}
                        {equipped && (
                          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-lg bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a]">
                            <Check size={10} strokeWidth={4} /> ใส่อยู่
                          </span>
                        )}
                      </span>
                      <h3 className={`text-3xl md:text-5xl font-black break-words leading-tight ${isHacker ? 'text-green-400' : isDark ? 'text-yellow-400' : 'text-orange-600'}`}>
                        {selectedTitle.label}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedTitle(null)}
                      className={`p-2 rounded-xl border-2 transition-colors btn-squishy shrink-0 ${isHacker ? 'bg-[#111] border-green-800 text-green-500 hover:text-green-400' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-white/50 hover:text-white' : 'bg-orange-50 border-orange-200 text-orange-400 hover:text-orange-600'}`}
                    >
                      <X size={24} strokeWidth={3} />
                    </button>
                  </div>

                  <div className={`p-6 rounded-[20px] border-l-8 border-r-2 border-y-2 text-lg font-bold leading-relaxed shadow-inner ${isHacker ? 'bg-[#111] border-l-green-500 border-green-900 text-green-500' : isDark ? 'bg-[#2D223B]/50 border-l-yellow-400 border-[#382E54] text-white' : 'bg-orange-50 border-l-orange-500 border-white text-orange-950'}`}>
                    {selectedTitle.desc}
                  </div>

                  {/* ราคา + ปุ่มซื้อ/ใส่/ถอด (ชุดเดียวกับการ์ด แต่ใหญ่เต็มความกว้าง) */}
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 text-xl font-black shrink-0 text-amber-500 dark:text-yellow-400 hacker:text-green-400">
                      <CoinIcon size={24} /> {selectedTitle.price.toLocaleString()}
                    </span>
                    {owned ? (
                      <button
                        onClick={() => handleEquip(selectedTitle, equipped)}
                        disabled={busy}
                        className={`btn-squishy flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest border-4 shadow-sm transition-colors disabled:opacity-60 ${equipped
                          ? 'bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-orange-200 dark:border-[#4B3965] hacker:border-green-800 text-orange-500 dark:text-yellow-400 hacker:text-green-500'
                          : 'bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-white dark:border-yellow-300 hacker:border-green-400 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a]'
                          }`}
                      >
                        {busy ? '...' : equipped ? 'ถอดฉายา' : 'ใส่ฉายานี้'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBuy(selectedTitle)}
                        disabled={busy || !canAfford}
                        className={`btn-squishy flex-1 py-4 rounded-2xl text-sm font-black uppercase tracking-widest border-4 shadow-sm flex items-center justify-center gap-2 transition-colors ${canAfford
                          ? 'bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-white dark:border-yellow-300 hacker:border-green-400 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a]'
                          : 'bg-slate-100 dark:bg-[#2D223B] hacker:bg-[#111] border-white dark:border-[#4B3965] hacker:border-[#333] text-slate-400 dark:text-white/30 hacker:text-white/30 cursor-not-allowed'
                          }`}
                      >
                        {busy ? '...' : canAfford ? <><Check size={18} strokeWidth={3} /> ซื้อเลย</> : <><Lock size={18} strokeWidth={3} /> เหรียญไม่พอ</>}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Toast แจ้งผล */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-[24px] border-4 shadow-xl font-black text-sm flex items-center gap-3 ${toast.ok
              ? 'bg-emerald-500 border-white text-white'
              : 'bg-rose-500 border-white text-white'
              }`}
          >
            {toast.ok ? <Check size={20} strokeWidth={3} /> : <AlertCircle size={20} strokeWidth={3} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // 🃏 การ์ดสินค้า — ใช้ร่วมกันทั้งหน้าร้านและคลัง (function declaration ถูก hoist ให้ใช้ใน JSX ด้านบนได้)
  function renderCard(item: ShopItem, i: number) {
    const owned = ownedIds.includes(item.id);
    const equipped = equippedFor(item);
    const canAfford = coins >= item.price;
    const busy = busyId === item.id;

    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        onClick={() => { if (item.type === 'title') setSelectedTitle(item); }}
        title={item.type === 'title' ? 'กดเพื่อดูแบบขยาย' : undefined}
        className={`glass-card p-5 md:p-6 flex flex-col gap-3 shadow-sm relative overflow-hidden ${equipped ? 'ring-4 ring-orange-400 dark:ring-yellow-400 hacker:ring-green-500' : ''} ${item.type === 'title' ? 'cursor-pointer hover:-translate-y-1 transition-transform' : ''}`}
      >
        {/* ป้าย "ใส่อยู่" เป็น element ปกติใน flow (ไม่ absolute) — ดันเนื้อหาลงแทนการลอยทับกล่องพรีวิว */}
        {equipped && (
          <div className="flex justify-end -mb-1">
            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a] shadow-sm">
              <Check size={10} strokeWidth={4} /> ใส่อยู่
            </span>
          </div>
        )}

        {/* พรีวิว */}
        {item.type === 'title' ? (
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} strokeWidth={3} className="text-orange-400 dark:text-yellow-400 hacker:text-green-500 shrink-0" />
            <span className="px-3 py-1.5 rounded-xl text-xs font-black border-2 shadow-sm bg-orange-100 border-white text-orange-600 dark:bg-yellow-400/15 dark:border-[#4B3965] dark:text-yellow-300 hacker:bg-green-900/30 hacker:border-green-800 hacker:text-green-400">
              {item.label}
            </span>
          </div>
        ) : item.type === 'cursor' ? (
          /* 🖱️ พรีวิวเอฟเฟกต์เมาส์: เทรลโค้งกระจายตามหลังลูกศร (ตำแหน่ง/องศาไม่เรียงแถว ให้ดูเป็นเทรลจริง) */
          <div className="relative h-24 rounded-xl border-2 border-orange-100 dark:border-[#4B3965] hacker:border-green-900 mb-1 overflow-hidden select-none bg-orange-50/60 dark:bg-black/20 hacker:bg-black/40">
            <span className="absolute left-[6%] bottom-[12%] text-[11px] opacity-25 -rotate-[18deg]">{item.emoji}</span>
            <span className="absolute left-[19%] bottom-[42%] text-[13px] opacity-40 rotate-[10deg]">{item.emoji}</span>
            <span className="absolute left-[33%] bottom-[20%] text-[15px] opacity-55 -rotate-[8deg]">{item.emoji}</span>
            <span className="absolute left-[47%] bottom-[52%] text-[17px] opacity-70 rotate-[14deg]">{item.emoji}</span>
            <span className="absolute left-[60%] bottom-[28%] text-[20px] opacity-85 -rotate-[12deg]">{item.emoji}</span>
            <span className="absolute left-[72%] bottom-[48%] text-[24px] rotate-[6deg] animate-pulse">{item.emoji}</span>
            <MousePointer2 size={22} strokeWidth={3} className="absolute right-[6%] bottom-[30%] text-orange-500 dark:text-yellow-400 hacker:text-green-500 drop-shadow-sm" />
          </div>
        ) : (
          /* 🎨 พรีวิวธีม: จำลองหน้าเว็บย่อส่วนด้วยสีจริงของธีมนั้น */
          <div
            className="rounded-xl border-2 border-orange-100 dark:border-[#4B3965] hacker:border-green-900 p-3 mb-1 overflow-hidden"
            style={{ backgroundColor: item.preview?.[0] }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-6 h-2 rounded-full" style={{ backgroundColor: item.preview?.[1] }} />
              <span className="w-10 h-2 rounded-full opacity-60" style={{ backgroundColor: item.preview?.[2] }} />
            </div>
            <div className="flex gap-1.5">
              <span className="flex-1 h-7 rounded-lg" style={{ backgroundColor: item.preview?.[1] }} />
              <span className="flex-1 h-7 rounded-lg opacity-50" style={{ backgroundColor: item.preview?.[2] }} />
              <span className="w-7 h-7 rounded-lg opacity-30" style={{ backgroundColor: item.preview?.[2] }} />
            </div>
          </div>
        )}

        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-black tracking-tight text-orange-950 dark:text-white hacker:text-white truncate">{item.name}</h3>
          <p className="text-[11px] md:text-xs font-bold leading-relaxed text-orange-700 dark:text-white/60 hacker:text-green-600 mt-1">{item.desc}</p>
        </div>

        <div className="flex items-center justify-between gap-3 mt-auto pt-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-black text-amber-500 dark:text-yellow-400 hacker:text-green-400">
            <CoinIcon size={17} /> {item.price.toLocaleString()}
          </span>

          {owned ? (
            <button
              onClick={(e) => { e.stopPropagation(); handleEquip(item, equipped); }}
              disabled={busy}
              className={`btn-squishy px-4 py-2.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border-4 shadow-sm transition-colors disabled:opacity-60 ${equipped
                ? 'bg-white dark:bg-[#2D223B] hacker:bg-[#111] border-orange-200 dark:border-[#4B3965] hacker:border-green-800 text-orange-500 dark:text-yellow-400 hacker:text-green-500'
                : 'bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-white dark:border-yellow-300 hacker:border-green-400 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a]'
                }`}
            >
              {busy ? '...' : equipped ? 'ถอด' : 'ใส่'}
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); handleBuy(item); }}
              disabled={busy || !canAfford}
              title={canAfford ? 'ซื้อของชิ้นนี้' : 'เหรียญไม่พอ'}
              className={`btn-squishy px-4 py-2.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest border-4 shadow-sm flex items-center gap-1.5 transition-colors ${canAfford
                ? 'bg-orange-500 dark:bg-yellow-400 hacker:bg-green-500 border-white dark:border-yellow-300 hacker:border-green-400 text-white dark:text-[#1E1B2E] hacker:text-[#0a0a0a]'
                : 'bg-slate-100 dark:bg-[#2D223B] hacker:bg-[#111] border-white dark:border-[#4B3965] hacker:border-[#333] text-slate-400 dark:text-white/30 hacker:text-white/30 cursor-not-allowed'
                }`}
            >
              {busy ? '...' : canAfford ? <><Check size={14} strokeWidth={3} /> ซื้อ</> : <><Lock size={14} strokeWidth={3} /> เหรียญไม่พอ</>}
            </button>
          )}
        </div>
      </motion.div>
    );
  }
}


