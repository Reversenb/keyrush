"use client";

import React, { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Navbar from '@/components/Navbar';
import HackerLoadingScreen from '@/components/HackerLoadingScreen';
import {
  ChevronDown, PlusCircle, Database, Terminal, Monitor,
  Search, X, Edit, Trash2, Heart, CheckCircle2, AlertTriangle, XCircle, ShieldCheck
} from 'lucide-react';

// =====================================================================
// 🌟 คอมโพเนนต์ Custom Dropdown
// =====================================================================
const CustomDropdown = ({
  label, options, value, onChange, theme
}: {
  label: string, options: { value: string, label: string }[], value: string, onChange: (val: string) => void, theme: string
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLabel = options.find(o => o.value === value)?.label || 'SELECT...';

  const isDark = theme === 'dark';
  const isHacker = theme === 'hacker';

  const labelColor = isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-400';
  const btnBg = isHacker ? 'bg-[#111] border-green-800 text-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-white' : 'bg-white border-orange-100 text-orange-950';
  const btnHover = isHacker ? 'hover:border-green-600' : isDark ? 'hover:border-yellow-500' : 'hover:border-orange-300';
  const btnActive = isHacker ? 'border-green-500 text-green-400 shadow-[0_4px_0_#14532d]' : isDark ? 'border-yellow-400 text-yellow-400 shadow-[0_4px_0_#ca8a04]' : 'border-orange-500 text-orange-600 shadow-[0_4px_0_#c2410c]';

  return (
    <div className="space-y-2 relative">
      <label className={`text-xs uppercase tracking-widest font-black ${labelColor}`}>{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex justify-between items-center border-4 rounded-[20px] px-5 py-4 transition-all outline-none btn-squishy ${isOpen ? btnActive : `${btnBg} ${btnHover}`}`}
        >
          <span className="font-black tracking-wider text-sm">{selectedLabel}</span>
          <ChevronDown size={20} strokeWidth={3} className={`transition-transform duration-300 ${isOpen ? 'rotate-180 text-current' : 'opacity-50'}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
              <motion.div
                initial={{ opacity: 0, y: -10, scaleY: 0.9 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={`absolute top-[110%] left-0 w-full border-4 rounded-[24px] shadow-lg overflow-hidden z-50 transform origin-top p-2 ${isHacker ? 'bg-[#0a0a0a] border-green-800' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-orange-100'}`}
              >
                {options.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={`px-5 py-4 cursor-pointer transition-all rounded-[16px] flex items-center gap-3 font-black text-sm
                      ${value === opt.value
                        ? (isHacker ? 'bg-green-900/30 text-green-400' : isDark ? 'bg-yellow-400/20 text-yellow-400' : 'bg-orange-100 text-orange-600')
                        : (isHacker ? 'text-green-600/60 hover:bg-[#111] hover:text-green-500' : isDark ? 'text-white/60 hover:bg-[#2D223B] hover:text-white' : 'text-orange-950/60 hover:bg-orange-50 hover:text-orange-950')
                      }
                    `}
                  >
                    {value === opt.value && <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isHacker ? 'bg-green-500' : isDark ? 'bg-yellow-400' : 'bg-orange-500'}`}></div>}
                    {opt.label}
                  </div>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// =====================================================================
// 🚀 หน้าหลัก Mission Control CMS
// =====================================================================
export default function MissionControlCMS() {
  const router = useRouter();

  // 🌟 Theme State
  const { theme: activeTheme, resolvedTheme } = useTheme();
  const currentTheme = activeTheme === 'system' ? resolvedTheme : activeTheme;
  const isDark = currentTheme === 'dark';
  const isHacker = currentTheme === 'hacker';

  const [missions, setMissions] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);

  const [favorites, setFavorites] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [filterOs, setFilterOs] = useState('all');
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean, id: string | null }>({ show: false, id: null });

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type }), 3000);
  };

  const [formData, setFormData] = useState({
    os: 'linux',
    difficulty: 'basic',
    level: '',
    title: '',
    description: '',
    expectedCommand: '',
    hint: '',
    rewardExp: '100'
  });

  useEffect(() => {
    const storedFavs = localStorage.getItem('keyrush_admin_favs');
    if (storedFavs) {
      try { setFavorites(JSON.parse(storedFavs)); } catch (e) { }
    }

    const checkAdminAccess = () => {
      const token = localStorage.getItem('keyrush_token');
      const userStr = localStorage.getItem('keyrush_user');

      if (!token || !userStr) {
        showToast('กรุณาเข้าสู่ระบบก่อนครับ!', 'error');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      const user = JSON.parse(userStr);
      if (user.role?.toLowerCase() !== 'admin') {
        showToast('SECURITY ALERT: พื้นที่นี้สำหรับผู้ดูแลระบบ (Admin) เท่านั้น!', 'error');
        setTimeout(() => router.push('/dashboard'), 1500);
        return;
      }

      fetchMissions(token);
    };

    checkAdminAccess();
  }, [router]);

  const fetchMissions = async (tokenParam?: string) => {
    setIsFetchingData(true);
    try {
      const token = tokenParam || localStorage.getItem('keyrush_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/missions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMissions(data.data);
      } else if (res.status === 403 || res.status === 401) {
        showToast('เซสชันหมดอายุ หรือไม่มีสิทธิ์เข้าถึง', 'error');
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (error) {
      console.error("ดึงข้อมูลไม่สำเร็จ:", error);
    } finally {
      setTimeout(() => {
        setIsFetchingData(false);
      }, 500);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ os: 'linux', difficulty: 'basic', level: '', title: '', description: '', expectedCommand: '', hint: '', rewardExp: '100' });
    setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, mission: any) => {
    e.stopPropagation();
    setEditingId(mission.id);
    setFormData({
      os: mission.os,
      difficulty: mission.difficulty,
      level: mission.level.toString(),
      title: mission.title,
      description: mission.description,
      expectedCommand: mission.expectedCommand,
      hint: mission.hint || '',
      rewardExp: mission.rewardExp.toString()
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.level || !formData.title || !formData.expectedCommand) {
      showToast("กรุณากรอกข้อมูลที่จำเป็นให้ครบครับบอส!", 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('keyrush_token');
      const url = editingId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/missions/${editingId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/missions`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (data.success) {
        showToast(editingId ? "อัปเดตโจทย์สำเร็จ!" : "บันทึกโจทย์สำเร็จ!", 'success');
        fetchMissions();
        setIsModalOpen(false);
      } else {
        showToast("เกิดข้อผิดพลาด: " + data.message, 'error');
      }
    } catch (error) {
      console.error("บันทึกโจทย์ไม่สำเร็จ:", error);
      showToast("ไม่สามารถติดต่อ Backend ได้ครับ", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const promptDelete = (id: string) => {
    setDeleteConfirm({ show: true, id });
  };

  const confirmDeleteAction = async () => {
    if (!deleteConfirm.id) return;
    const id = deleteConfirm.id;
    setDeleteConfirm({ show: false, id: null });

    try {
      const token = localStorage.getItem('keyrush_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/missions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        showToast("ลบโจทย์ออกจากระบบเรียบร้อยแล้ว!", 'success');
        if (favorites.includes(id)) {
          const newFavs = favorites.filter(fId => fId !== id);
          setFavorites(newFavs);
          localStorage.setItem('keyrush_admin_favs', JSON.stringify(newFavs));
        }
        fetchMissions();
      }
    } catch (error) {
      console.error("ลบไม่สำเร็จ:", error);
      showToast("เกิดข้อผิดพลาดในการลบ", 'error');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    let newFavs;
    if (favorites.includes(id)) {
      newFavs = favorites.filter(fId => fId !== id);
      showToast("นำออกจากรายการโปรดแล้ว", 'success');
    } else {
      newFavs = [...favorites, id];
      showToast("เพิ่มลงรายการโปรดเรียบร้อย!", 'success');
    }
    setFavorites(newFavs);
    localStorage.setItem('keyrush_admin_favs', JSON.stringify(newFavs));
  };

  const filteredMissions = missions.filter(mission => {
    const matchOs = filterOs === 'all' || mission.os === filterOs;
    const matchDiff = filterDifficulty === 'all' || mission.difficulty === filterDifficulty;
    const searchLower = searchQuery.toLowerCase();
    const matchSearch =
      mission.title.toLowerCase().includes(searchLower) ||
      mission.expectedCommand.toLowerCase().includes(searchLower) ||
      mission.description.toLowerCase().includes(searchLower);

    return matchOs && matchDiff && matchSearch;
  });

  const favMissions = filteredMissions.filter(m => favorites.includes(m.id));
  const regularMissions = filteredMissions.filter(m => !favorites.includes(m.id));

  const renderMissionRow = (mission: any, isFav: boolean) => (
    <Fragment key={mission.id}>
      <motion.tr
        onClick={() => toggleExpand(mission.id)}
        className={`transition-colors group cursor-pointer ${expandedId === mission.id ? (isHacker ? 'bg-green-900/20' : isDark ? 'bg-yellow-400/10' : 'bg-orange-100') : (isHacker ? 'hover:bg-[#111]' : isDark ? 'hover:bg-white/5' : 'hover:bg-white/60')}`}
      >
        <td className="p-5">
          <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${mission.os === 'linux' ? (isHacker ? 'bg-green-600 text-[#0a0a0a]' : 'bg-orange-500 text-white') : (isHacker ? 'bg-green-600 text-[#0a0a0a]' : 'bg-blue-500 text-white')} shadow-sm`}>
            {mission.os.toUpperCase()}
          </span>
        </td>
        <td className="p-5">
          <span className={`text-xs uppercase tracking-widest font-black ${mission.difficulty === 'basic' ? (isHacker ? 'text-green-500' : 'text-green-500') : mission.difficulty === 'intermediate' ? (isHacker ? 'text-yellow-400' : 'text-yellow-500') : 'text-rose-500'}`}>
            {mission.difficulty || 'BASIC'}
          </span>
        </td>
        <td className={`p-5 font-black text-xl cute-header ${isHacker ? 'text-green-500' : isDark ? 'text-white' : 'text-orange-950'}`}>LVL {mission.level}</td>
        <td className={`p-5 font-black flex items-center gap-3 ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>
          {mission.title}
          {isFav && <Heart size={18} strokeWidth={3} className="text-pink-500 fill-pink-500 drop-shadow-sm" />}
        </td>
        <td className="p-5">
          <code className={`px-4 py-2 rounded-xl border-2 shadow-sm font-black ${mission.os === 'linux' ? (isHacker ? 'bg-[#111] text-green-500 border-green-800' : isDark ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-orange-100 text-orange-600 border-white') : (isHacker ? 'bg-[#111] text-green-500 border-green-800' : isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-600 border-white')}`}>
            &gt; {mission.expectedCommand}
          </code>
        </td>
        <td className={`p-5 font-black text-lg ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-yellow-500'}`}>+{mission.rewardExp}</td>
        <td className="p-5 text-right flex justify-end gap-2">

          {/* 🌟 ปุ่ม Favorite 🌟 */}
          <button
            onClick={(e) => toggleFavorite(e, mission.id)}
            className={`p-3 rounded-[16px] transition-all duration-300 btn-squishy border-4 flex items-center justify-center shadow-sm 
              ${isFav
                ? (isHacker ? 'text-pink-500 bg-pink-900/30 border-pink-800' : isDark ? 'text-pink-400 bg-pink-500/20 border-pink-500/30' : 'text-pink-500 bg-pink-100 border-white')
                : (isHacker ? 'text-green-800 bg-[#0a0a0a] border-green-900 hover:text-pink-500 hover:border-pink-800' : isDark ? 'text-white/30 bg-[#1E1B2E] border-[#382E54] hover:text-pink-400 hover:border-pink-500/50' : 'text-slate-400 bg-white border-white hover:text-pink-500 hover:bg-pink-50')
              }`}
            title={isFav ? "Unfavorite" : "Add to Favorites"}
          >
            <Heart size={20} strokeWidth={3} className={isFav ? 'fill-pink-500' : ''} />
          </button>

          {/* 🌟 ปุ่ม Edit 🌟 */}
          <button
            onClick={(e) => openEditModal(e, mission)}
            className={`p-3 rounded-[16px] transition-colors flex items-center justify-center btn-squishy border-4 shadow-sm
              ${isHacker ? 'bg-[#0a0a0a] border-green-900 text-blue-500 hover:border-blue-800 hover:bg-blue-900/20' : isDark ? 'bg-[#1E1B2E] border-[#382E54] text-blue-400 hover:border-blue-500/50 hover:bg-blue-500/20' : 'bg-white border-white text-blue-500 hover:bg-blue-100'}
            `}
            title="Edit Mission"
          >
            <Edit size={20} strokeWidth={3} />
          </button>

          {/* 🌟 ปุ่ม Delete 🌟 */}
          <button
            onClick={(e) => { e.stopPropagation(); promptDelete(mission.id); }}
            className={`p-3 rounded-[16px] transition-colors flex items-center justify-center btn-squishy border-4 shadow-sm
              ${isHacker ? 'bg-[#0a0a0a] border-green-900 text-rose-500 hover:border-rose-800 hover:bg-rose-900/20' : isDark ? 'bg-[#1E1B2E] border-[#382E54] text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/20' : 'bg-white border-white text-rose-500 hover:bg-rose-100'}
            `}
            title="Delete Mission"
          >
            <Trash2 size={20} strokeWidth={3} />
          </button>

          <button className={`p-3 transition-colors flex items-center justify-center ${isHacker ? 'text-green-600 hover:text-green-400' : isDark ? 'text-white/50 hover:text-yellow-400' : 'text-orange-400 hover:text-orange-600'}`}>
            <ChevronDown size={24} strokeWidth={3} className={`transition-transform duration-300 ${expandedId === mission.id ? `rotate-180 ${isHacker ? 'text-green-400' : isDark ? 'text-yellow-400' : 'text-orange-500'}` : ''}`} />
          </button>
        </td>
      </motion.tr>

      <AnimatePresence>
        {expandedId === mission.id && (
          <tr>
            <td colSpan={7} className="p-0 border-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className={`p-6 m-3 rounded-2xl shadow-inner border-l-8 border-r-2 border-y-2
                  ${isHacker ? 'bg-[#111] border-l-green-500 border-green-900 text-green-400' : isDark ? 'bg-[#2D223B]/50 border-l-yellow-400 border-[#382E54] text-white/80' : 'bg-orange-100/50 border-l-orange-400 border-white text-orange-900'}
                `}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <span className={`font-black uppercase tracking-widest text-[10px] block mb-2 ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-500'}`}>Description</span>
                        <p className={`text-sm p-4 rounded-xl border-2 shadow-sm font-bold leading-relaxed ${isHacker ? 'bg-[#0a0a0a] border-green-800' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                          {mission.description}
                        </p>
                      </div>
                      <div>
                        <span className={`font-black uppercase tracking-widest text-[10px] block mb-2 ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-500'}`}>Hint</span>
                        <p className={`text-sm font-black p-4 rounded-xl border-2 shadow-sm ${isHacker ? 'bg-green-900/30 text-green-400 border-green-800' : isDark ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border-white'}`}>
                          💡 {mission.hint || 'ไม่มีคำใบ้สำหรับด่านนี้'}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <span className={`font-black uppercase tracking-widest text-[10px] block mb-2 ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-500'}`}>Database ID</span>
                        <code className={`text-xs font-black p-3 rounded-xl block border-2 shadow-sm break-all ${isHacker ? 'bg-[#0a0a0a] text-green-500 border-green-800' : isDark ? 'bg-[#1E1B2E] text-yellow-400 border-[#382E54]' : 'bg-white text-orange-400 border-white'}`}>
                          {mission.id}
                        </code>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <span className={`font-black uppercase tracking-widest text-[10px] block mb-2 ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-500'}`}>Created At</span>
                          <span className={`text-xs font-bold ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-950/70'}`}>{new Date(mission.createdAt).toLocaleString('th-TH')}</span>
                        </div>
                        <div>
                          <span className={`font-black uppercase tracking-widest text-[10px] block mb-2 ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-500'}`}>Updated At</span>
                          <span className={`text-xs font-bold ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-950/70'}`}>{new Date(mission.updatedAt).toLocaleString('th-TH')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </Fragment>
  );

  return (
    <div className="min-h-screen bg-background font-sans font-black flex flex-col selection:bg-orange-500/20 dark:selection:bg-yellow-400/20 hacker:selection:bg-green-500/20 relative transition-colors duration-500">

      {/* 🌸 สไตล์สำหรับโหมดต่างๆ 🌸 */}
      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(16px);
          border: 4px solid white;
          border-radius: 40px;
          box-shadow: 0 10px 30px rgba(249, 115, 22, 0.1);
          transition: all 0.3s ease;
        }

        .dark .glass-card {
          background: rgba(45, 34, 59, 0.7); 
          border-color: #382E54;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }

        .hacker .glass-card {
          background: rgba(10, 10, 10, 0.85); 
          border-color: #166534; 
          box-shadow: 0 10px 30px rgba(34, 197, 94, 0.15);
        }

        .btn-squishy {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.1s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s, border-color 0.2s, color 0.2s;
        }
        .btn-squishy:hover { transform: translateY(-2px); }
        .btn-squishy:active { transform: translateY(6px); box-shadow: 0 0 0 transparent !important; }

        .cute-header {
          text-shadow: 2px 2px 0px rgba(255, 255, 255, 1), 
                       -1px -1px 0px rgba(255, 255, 255, 1), 
                       1px -1px 0px rgba(255, 255, 255, 1), 
                       -1px 1px 0px rgba(255, 255, 255, 1);
          letter-spacing: -0.02em;
        }

        .dark .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.3); }
        .hacker .cute-header { text-shadow: 2px 2px 0px rgba(0, 0, 0, 0.8); }

        .custom-scrollbar::-webkit-scrollbar { width: 8px; height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(249,115,22,0.3); border-radius: 4px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250,204,21,0.3); }
        .hacker .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34,197,94,0.3); }
      `}</style>

      {/* 🌟 Toast Notification 🌟 */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-[24px] border-4 shadow-xl flex items-center gap-3 backdrop-blur-md font-black text-sm uppercase tracking-widest
              ${toast.type === 'success'
                ? (isHacker ? 'bg-[#0a0a0a] border-green-500 text-green-400' : isDark ? 'bg-[#1E1B2E] border-green-400 text-green-400' : 'bg-green-100 border-white text-green-600')
                : toast.type === 'warning'
                  ? (isHacker ? 'bg-[#0a0a0a] border-yellow-500 text-yellow-400' : isDark ? 'bg-[#1E1B2E] border-yellow-400 text-yellow-400' : 'bg-amber-100 border-white text-amber-600')
                  : (isHacker ? 'bg-[#0a0a0a] border-rose-500 text-rose-400' : isDark ? 'bg-[#1E1B2E] border-rose-400 text-rose-400' : 'bg-rose-100 border-white text-rose-600')
              }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={24} strokeWidth={3} /> :
              toast.type === 'warning' ? <AlertTriangle size={24} strokeWidth={3} /> :
                <XCircle size={24} strokeWidth={3} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 🌟 Delete Confirm Modal 🌟 */}
      <AnimatePresence>
        {deleteConfirm.show && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`absolute inset-0 backdrop-blur-sm ${isHacker ? 'bg-black/80' : isDark ? 'bg-black/60' : 'bg-orange-950/40'}`}></motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              className={`relative border-4 rounded-[40px] p-10 max-w-sm w-full shadow-2xl flex flex-col items-center text-center ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}
            >
              <div className={`size-24 rounded-[28px] flex items-center justify-center mb-6 border-4 shadow-sm ${isHacker ? 'bg-[#111] border-rose-900' : isDark ? 'bg-[#2D223B] border-rose-900/50' : 'bg-rose-100 border-white'}`}>
                <AlertTriangle size={40} strokeWidth={3} className={isHacker ? 'text-rose-600' : 'text-rose-500'} />
              </div>
              <h3 className={`text-3xl font-black mb-3 tracking-tight cute-header ${isHacker ? 'text-green-500' : isDark ? 'text-white' : 'text-orange-950'}`}>ยืนยันการลบ?</h3>
              <p className={`text-sm mb-8 font-bold ${isHacker ? 'text-green-600/70' : isDark ? 'text-white/60' : 'text-orange-600'}`}>แน่ใจนะว่าจะลบโจทย์นี้?<br />ลบแล้วกู้คืนกลับมาไม่ได้นะบอส!</p>

              <div className="flex w-full gap-4">
                <button
                  onClick={() => setDeleteConfirm({ show: false, id: null })}
                  className={`flex-1 py-4 rounded-[20px] font-black border-4 transition-colors uppercase tracking-widest text-xs btn-squishy shadow-sm ${isHacker ? 'bg-[#111] border-green-900 text-green-500 hover:border-green-600' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-white hover:border-yellow-500' : 'bg-orange-50 border-white text-orange-500 hover:border-orange-300'}`}
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmDeleteAction}
                  className={`flex-1 py-4 rounded-[20px] font-black text-white border-4 transition-all uppercase tracking-widest text-xs btn-squishy ${isHacker ? 'bg-rose-700 border-rose-600 shadow-[0_8px_0_#881337] hover:bg-rose-600' : isDark ? 'bg-rose-600 border-rose-500 shadow-[0_8px_0_#9f1239] hover:bg-rose-500' : 'bg-rose-500 border-white shadow-[0_8px_0_rgba(225,29,72,0.2)] hover:bg-rose-400'}`}
                >
                  ลบเลย
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Navbar theme="linux" />

      <main className="flex-1 relative overflow-hidden p-6 lg:p-12">
        {/* 🎈 Background Blobs 🎈 */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-orange-400 dark:bg-yellow-500 hacker:bg-green-600 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-element pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-amber-400 dark:bg-yellow-600 hacker:bg-green-700 rounded-full blur-[100px] opacity-20 dark:opacity-10 hacker:opacity-10 float-delayed pointer-events-none z-0" style={{ animationDelay: '1.5s' }} />

        <div className="max-w-[1400px] mx-auto relative z-10">
          <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className={`inline-flex items-center gap-2 px-4 py-2 mb-4 border-4 rounded-[16px] shadow-sm btn-squishy ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}>
                <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isHacker ? 'bg-green-500' : isDark ? 'bg-yellow-400' : 'bg-orange-500'}`}></span>
                <span className={`font-black text-[11px] uppercase tracking-widest ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-500'}`}>Admin Control</span>
              </div>
              <h1 className={`text-4xl md:text-6xl font-black tracking-tighter drop-shadow-sm cute-header leading-none ${isHacker ? 'text-white' : isDark ? 'text-white' : 'text-orange-950'}`}>
                MISSION <span className={`block ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-500'}`}>MANAGER</span>
              </h1>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              onClick={openAddModal}
              className={`group flex items-center justify-center gap-2 px-8 py-5 text-[#1E1B2E] rounded-[24px] font-black uppercase tracking-widest text-sm transition-all border-4 btn-squishy w-full md:w-auto ${isHacker ? 'bg-green-500 border-green-400 shadow-[0_8px_0_#14532d] hover:bg-green-400' : isDark ? 'bg-yellow-400 border-yellow-300 shadow-[0_8px_0_#ca8a04] hover:bg-yellow-300' : 'bg-orange-500 border-white text-white shadow-[0_8px_0_rgba(249,115,22,0.2)] hover:bg-orange-400'}`}
            >
              <PlusCircle size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
              New Mission
            </motion.button>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="grid grid-cols-2 lg:grid-cols-3 gap-6 mb-10"
          >
            <div className="glass-card p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center border-4 shadow-sm group-hover:scale-110 transition-transform ${isHacker ? 'bg-[#111] border-green-900 text-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-yellow-400' : 'bg-white border-orange-100 text-orange-500'}`}>
                <Database size={28} strokeWidth={3} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Total Missions</p>
                <p className={`text-3xl font-black cute-header ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>{missions.length}</p>
              </div>
            </div>

            <div className="glass-card p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center border-4 shadow-sm group-hover:scale-110 transition-transform ${isHacker ? 'bg-[#111] border-green-900 text-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-orange-400' : 'bg-white border-orange-100 text-orange-600'}`}>
                <Terminal size={28} strokeWidth={3} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Linux Active</p>
                <p className={`text-3xl font-black cute-header ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>{missions.filter(m => m.os === 'linux').length}</p>
              </div>
            </div>

            <div className="glass-card p-6 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow group col-span-2 lg:col-span-1">
              <div className={`w-16 h-16 rounded-[20px] flex items-center justify-center border-4 shadow-sm group-hover:scale-110 transition-transform ${isHacker ? 'bg-[#111] border-green-900 text-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-blue-400' : 'bg-white border-blue-100 text-blue-500'}`}>
                <Monitor size={28} strokeWidth={3} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-blue-400'}`}>Windows Active</p>
                <p className={`text-3xl font-black cute-header ${isHacker ? 'text-green-400' : isDark ? 'text-white' : 'text-orange-950'}`}>{missions.filter(m => m.os === 'windows').length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 mb-8 p-4 rounded-[28px] border-4 shadow-sm backdrop-blur-md ${isHacker ? 'bg-[#0a0a0a]/80 border-[#166534]' : isDark ? 'bg-[#1E1B2E]/80 border-[#382E54]' : 'bg-white/60 border-white'}`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 w-full xl:w-auto">

              <div className="flex items-center gap-2 font-black text-sm overflow-x-auto pb-2 md:pb-0 custom-scrollbar w-full md:w-auto px-2">
                <span className={`uppercase tracking-widest mr-2 shrink-0 text-xs ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-500'}`}>OS:</span>
                {['all', 'linux', 'windows'].map((osType) => (
                  <button
                    key={osType}
                    onClick={() => setFilterOs(osType)}
                    className={`px-6 py-3 rounded-[16px] transition-all border-4 uppercase tracking-widest shrink-0 btn-squishy text-xs ${filterOs === osType
                      ? (isHacker ? 'bg-green-500 text-[#0a0a0a] border-green-400 shadow-[0_4px_0_#14532d]' : isDark ? 'bg-yellow-400 text-[#1E1B2E] border-yellow-300 shadow-[0_4px_0_#ca8a04]' : 'bg-orange-500 text-white border-white shadow-sm')
                      : (isHacker ? 'bg-[#111] text-green-600/60 border-[#166534] hover:bg-[#1a1a1a] hover:text-green-500 hover:border-green-600' : isDark ? 'bg-[#2D223B] text-white/50 border-[#4B3965] hover:bg-[#382E54] hover:text-white hover:border-[#6b528f]' : 'bg-white text-orange-400 border-white hover:bg-orange-50 hover:text-orange-600')
                      }`}
                  >
                    {osType}
                  </button>
                ))}
              </div>

              <div className={`hidden md:block w-1 h-10 rounded-full mx-2 ${isHacker ? 'bg-green-900/50' : isDark ? 'bg-white/5' : 'bg-orange-100'}`}></div>

              <div className="flex items-center gap-3 font-black text-sm w-full md:w-auto px-2">
                <span className={`uppercase tracking-widest shrink-0 text-xs ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-500' : 'text-orange-500'}`}>LVL:</span>
                <div className="relative w-full md:w-48">
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className={`w-full border-4 rounded-[16px] pl-5 pr-10 py-3 focus:outline-none shadow-sm appearance-none transition-all cursor-pointer font-black uppercase tracking-widest text-xs 
                      ${isHacker ? 'bg-[#111] border-[#166534] text-green-500 focus:border-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-white focus:border-yellow-400' : 'bg-white border-white text-orange-950 focus:border-orange-300'}`}
                  >
                    <option value="all">ALL</option>
                    <option value="basic">BASIC</option>
                    <option value="intermediate">INTERMEDIATE</option>
                    <option value="advanced">ADVANCED</option>
                  </select>
                  <span className={`absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>
                    <ChevronDown size={20} strokeWidth={3} />
                  </span>
                </div>
              </div>

            </div>

            <div className="relative w-full xl:w-96 px-2 md:px-0">
              <span className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none ${isHacker ? 'text-green-600' : isDark ? 'text-white/40' : 'text-orange-400'}`}>
                <Search size={20} strokeWidth={3} />
              </span>
              <input
                type="text"
                placeholder="ค้นหาชื่อโจทย์, คำสั่ง..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full border-4 rounded-[20px] pl-12 pr-12 py-3.5 text-sm font-black shadow-sm outline-none transition-all 
                  ${isHacker ? 'bg-[#111] border-[#166534] text-green-400 placeholder-green-800 focus:border-green-500' : isDark ? 'bg-[#2D223B] border-[#4B3965] text-white placeholder-white/30 focus:border-yellow-400' : 'bg-white border-white text-orange-950 placeholder-orange-300 focus:border-orange-300'}`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={`absolute inset-y-0 right-0 pr-5 flex items-center transition-colors ${isHacker ? 'text-green-600 hover:text-green-400' : isDark ? 'text-white/40 hover:text-white' : 'text-orange-300 hover:text-orange-600'}`}
                >
                  <X size={20} strokeWidth={3} />
                </button>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={`glass-card overflow-hidden shadow-sm border-4 ${isHacker ? 'border-[#166534]' : isDark ? 'border-[#382E54]' : 'border-white'}`}
          >
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className={`border-b-4 font-black text-[11px] uppercase tracking-widest ${isHacker ? 'bg-green-900/40 border-[#166534] text-green-500' : isDark ? 'bg-[#2D223B] border-[#382E54] text-white/60' : 'bg-orange-100 border-white text-orange-600'}`}>
                    <th className="p-6">OS</th>
                    <th className="p-6">Difficulty</th>
                    <th className="p-6">Level</th>
                    <th className="p-6">Title</th>
                    <th className="p-6">Expected Command</th>
                    <th className="p-6">EXP</th>
                    <th className="p-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y-4 font-bold text-sm ${isHacker ? 'divide-[#166534]' : isDark ? 'divide-[#382E54]' : 'divide-white'}`}>

                  {isFetchingData ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="p-6"><div className={`h-8 w-20 rounded-xl ${isHacker ? 'bg-green-900/30' : isDark ? 'bg-[#382E54]' : 'bg-orange-100'}`}></div></td>
                        <td className="p-6"><div className={`h-5 w-24 rounded-lg ${isHacker ? 'bg-green-900/30' : isDark ? 'bg-[#382E54]' : 'bg-orange-100'}`}></div></td>
                        <td className="p-6"><div className={`h-6 w-16 rounded-lg ${isHacker ? 'bg-green-900/30' : isDark ? 'bg-[#382E54]' : 'bg-orange-100'}`}></div></td>
                        <td className="p-6"><div className={`h-5 w-40 rounded-lg ${isHacker ? 'bg-green-900/30' : isDark ? 'bg-[#382E54]' : 'bg-orange-100'}`}></div></td>
                        <td className="p-6"><div className={`h-8 w-48 rounded-xl ${isHacker ? 'bg-green-900/30' : isDark ? 'bg-[#382E54]' : 'bg-orange-100'}`}></div></td>
                        <td className="p-6"><div className={`h-6 w-16 rounded-lg ${isHacker ? 'bg-green-900/30' : isDark ? 'bg-[#382E54]' : 'bg-orange-100'}`}></div></td>
                        <td className="p-6 text-right"><div className={`h-10 w-32 rounded-xl inline-block ${isHacker ? 'bg-green-900/30' : isDark ? 'bg-[#382E54]' : 'bg-orange-100'}`}></div></td>
                      </tr>
                    ))
                  ) : filteredMissions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className={`p-20 text-center ${isHacker ? 'text-green-600' : isDark ? 'text-white/40' : 'text-orange-400'}`}>
                        <div className="flex flex-col items-center justify-center">
                          <Search size={64} strokeWidth={2} className="mb-4 opacity-50 animate-bounce" />
                          <p className="font-black uppercase tracking-widest text-sm">ไม่พบภารกิจที่ตรงกับการค้นหา</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* 🌟 แสดงหมวดหมู่ "PINNED FAVORITES" 🌟 */}
                      {favMissions.length > 0 && (
                        <>
                          <tr className={`border-y-4 ${isHacker ? 'bg-[#050505] border-[#166534]' : isDark ? 'bg-[#1a1423] border-[#382E54]' : 'bg-pink-50 border-white'}`}>
                            <td colSpan={7} className="p-4">
                              <div className={`flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest ${isHacker ? 'text-pink-600' : isDark ? 'text-pink-400' : 'text-pink-500'}`}>
                                <Heart size={18} strokeWidth={3} className={`animate-pulse ${isHacker ? 'fill-pink-800 text-pink-800' : isDark ? 'fill-pink-400' : 'fill-pink-500'}`} />
                                <span>Pinned Favorites</span>
                              </div>
                            </td>
                          </tr>
                          {favMissions.map(mission => renderMissionRow(mission, true))}
                        </>
                      )}

                      {favMissions.length > 0 && regularMissions.length > 0 && (
                        <tr className={`border-y-4 ${isHacker ? 'bg-[#050505] border-[#166534]' : isDark ? 'bg-[#1a1423] border-[#382E54]' : 'bg-orange-100/50 border-white'}`}>
                          <td colSpan={7} className="p-4">
                            <div className={`flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest ${isHacker ? 'text-green-700' : isDark ? 'text-white/40' : 'text-orange-400'}`}>
                              <Database size={18} strokeWidth={3} />
                              <span>Standard Missions</span>
                            </div>
                          </td>
                        </tr>
                      )}
                      {regularMissions.map(mission => renderMissionRow(mission, false))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* 🌟 Modal Add/Edit Mission 🌟 */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className={`absolute inset-0 backdrop-blur-sm ${isHacker ? 'bg-black/80' : isDark ? 'bg-black/60' : 'bg-orange-950/40'}`}></motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 25 } }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                className={`relative w-full max-w-2xl border-4 rounded-[32px] shadow-2xl overflow-visible flex flex-col ${isHacker ? 'bg-[#0a0a0a] border-[#166534]' : isDark ? 'bg-[#1E1B2E] border-[#382E54]' : 'bg-white border-white'}`}
              >
                <div className={`flex items-center justify-between px-8 py-5 border-b-4 rounded-t-[28px] ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#2D223B] border-[#382E54]' : 'bg-orange-50 border-white'}`}>
                  <span className={`font-black text-sm uppercase tracking-widest flex items-center gap-2 ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-500'}`}>
                    <ShieldCheck size={20} strokeWidth={3} />
                    {editingId ? 'Update Mission Data' : 'Create New Mission'}
                  </span>
                  <button onClick={() => setIsModalOpen(false)} className={`p-2 rounded-xl border-2 shadow-sm btn-squishy ${isHacker ? 'bg-[#0a0a0a] border-green-800 text-green-600 hover:text-green-400' : isDark ? 'bg-[#1E1B2E] border-[#4B3965] text-white/50 hover:text-white' : 'bg-white border-white text-orange-400 hover:text-orange-600'}`}><X size={18} strokeWidth={3} /></button>
                </div>

                <div className={`p-8 font-black space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar overflow-x-hidden relative rounded-b-[28px] ${isHacker ? 'bg-[#0a0a0a]' : isDark ? 'bg-[#1E1B2E]' : 'bg-white'}`}>

                  <div className="grid grid-cols-2 gap-6 relative z-30">
                    <CustomDropdown
                      label="Target OS"
                      value={formData.os}
                      onChange={(val) => setFormData({ ...formData, os: val })}
                      theme={currentTheme || 'light'}
                      options={[
                        { value: 'linux', label: 'LINUX' },
                        { value: 'windows', label: 'WINDOWS' },
                      ]}
                    />

                    <CustomDropdown
                      label="Difficulty"
                      value={formData.difficulty}
                      onChange={(val) => setFormData({ ...formData, difficulty: val })}
                      theme={currentTheme || 'light'}
                      options={[
                        { value: 'basic', label: 'BASIC' },
                        { value: 'intermediate', label: 'INTERMEDIATE' },
                        { value: 'advanced', label: 'ADVANCED' },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6 relative z-10">
                    <div className="space-y-2">
                      <label className={`text-xs uppercase tracking-widest font-black pl-1 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Level / Stage</label>
                      <input
                        type="number" value={formData.level} onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                        placeholder="e.g. 1"
                        className={`w-full border-4 rounded-[20px] px-5 py-4 font-black text-lg outline-none transition-all shadow-sm ${isHacker ? 'bg-[#111] border-[#166534] text-green-400 focus:border-green-500 placeholder-green-800' : isDark ? 'bg-[#2D223B] border-[#382E54] text-white focus:border-yellow-400 placeholder-white/30' : 'bg-orange-50 border-white text-orange-950 focus:border-orange-300 placeholder-orange-200'}`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-xs uppercase tracking-widest font-black pl-1 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Reward EXP</label>
                      <input
                        type="number" value={formData.rewardExp} onChange={(e) => setFormData({ ...formData, rewardExp: e.target.value })}
                        className={`w-full border-4 rounded-[20px] px-5 py-4 font-black text-lg outline-none transition-all shadow-sm ${isHacker ? 'bg-[#111] border-[#166534] text-yellow-500 focus:border-yellow-400' : isDark ? 'bg-[#2D223B] border-[#382E54] text-yellow-400 focus:border-yellow-300' : 'bg-yellow-50 border-white text-yellow-600 focus:border-yellow-300'}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <label className={`text-xs uppercase tracking-widest font-black pl-1 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Mission Title</label>
                    <input
                      type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="ตั้งชื่อภารกิจให้น่าสนใจ..."
                      className={`w-full border-4 rounded-[20px] px-5 py-4 font-black text-base outline-none transition-all shadow-sm ${isHacker ? 'bg-[#111] border-[#166534] text-green-400 focus:border-green-500 placeholder-green-800' : isDark ? 'bg-[#2D223B] border-[#382E54] text-white focus:border-yellow-400 placeholder-white/30' : 'bg-orange-50 border-white text-orange-950 focus:border-orange-300 placeholder-orange-200'}`}
                    />
                  </div>

                  <div className="space-y-2 relative z-10">
                    <label className={`text-xs uppercase tracking-widest font-black pl-1 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Description</label>
                    <textarea
                      rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="อธิบายว่าผู้เล่นต้องทำอะไร..."
                      className={`w-full border-4 rounded-[24px] px-5 py-4 font-bold text-sm outline-none transition-all resize-none shadow-sm custom-scrollbar ${isHacker ? 'bg-[#111] border-[#166534] text-green-400 focus:border-green-500 placeholder-green-800' : isDark ? 'bg-[#2D223B] border-[#382E54] text-white/80 focus:border-yellow-400 placeholder-white/30' : 'bg-orange-50 border-white text-orange-950 focus:border-orange-300 placeholder-orange-200'}`}
                    ></textarea>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <label className={`text-xs uppercase tracking-widest font-black pl-1 flex items-center gap-2 ${isHacker ? 'text-green-500' : isDark ? 'text-yellow-400' : 'text-orange-500'}`}>
                      <Terminal size={16} strokeWidth={3} /> Expected Command
                    </label>
                    <div className={`relative flex items-center w-full border-4 rounded-[20px] px-5 py-4 transition-all shadow-sm ${isHacker ? 'bg-[#0a0a0a] border-green-800 focus-within:border-green-400' : isDark ? 'bg-[#1E1B2E] border-[#4B3965] focus-within:border-yellow-400' : 'bg-white border-orange-200 focus-within:border-orange-500'}`}>
                      <span className={`font-black mr-3 text-xl ${isHacker ? 'text-green-600' : isDark ? 'text-yellow-600' : 'text-orange-400'}`}>&gt;</span>
                      <input
                        type="text" value={formData.expectedCommand} onChange={(e) => setFormData({ ...formData, expectedCommand: e.target.value })}
                        placeholder="mkdir folder_name"
                        className={`bg-transparent outline-none font-black text-lg w-full ${isHacker ? 'text-green-400 placeholder-green-900' : isDark ? 'text-yellow-400 placeholder-yellow-900/50' : 'text-orange-600 placeholder-orange-200'}`}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 relative z-10">
                    <label className={`text-xs uppercase tracking-widest font-black pl-1 ${isHacker ? 'text-green-600' : isDark ? 'text-white/50' : 'text-orange-400'}`}>Hint (Optional)</label>
                    <input
                      type="text" value={formData.hint} onChange={(e) => setFormData({ ...formData, hint: e.target.value })}
                      placeholder="พิมพ์คำใบ้ตรงนี้..."
                      className={`w-full border-4 rounded-[20px] px-5 py-4 font-bold text-sm outline-none transition-all shadow-sm ${isHacker ? 'bg-[#111] border-[#166534] text-green-400 focus:border-green-500 placeholder-green-800' : isDark ? 'bg-[#2D223B] border-[#382E54] text-white/80 focus:border-yellow-400 placeholder-white/30' : 'bg-orange-50 border-white text-orange-950 focus:border-orange-300 placeholder-orange-200'}`}
                    />
                  </div>

                </div>

                <div className={`px-8 py-6 border-t-4 flex justify-end gap-4 z-10 rounded-b-[28px] ${isHacker ? 'bg-[#111] border-[#166534]' : isDark ? 'bg-[#2D223B] border-[#382E54]' : 'bg-orange-50 border-white'}`}>
                  <button onClick={() => setIsModalOpen(false)} className={`px-6 py-3.5 rounded-[16px] font-black text-sm uppercase tracking-widest border-4 transition-colors btn-squishy shadow-sm ${isHacker ? 'bg-[#0a0a0a] border-green-900 text-green-600 hover:border-green-700' : isDark ? 'bg-[#1E1B2E] border-[#4B3965] text-white/50 hover:text-white' : 'bg-white border-white text-orange-400 hover:border-orange-200'}`}>
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit} disabled={isLoading}
                    className={`px-8 py-3.5 rounded-[16px] font-black uppercase tracking-widest text-sm transition-all border-4 btn-squishy 
                      ${isLoading
                        ? (isHacker ? 'bg-green-900/50 border-green-800 text-green-700 shadow-sm' : isDark ? 'bg-yellow-900/50 border-yellow-800 text-yellow-700 shadow-sm' : 'bg-orange-200 border-white text-white shadow-sm')
                        : (isHacker ? 'bg-green-600 hover:bg-green-500 border-green-500 text-[#0a0a0a] shadow-[0_8px_0_#14532d]' : isDark ? 'bg-yellow-400 hover:bg-yellow-300 border-yellow-300 text-[#1E1B2E] shadow-[0_8px_0_#ca8a04]' : 'bg-orange-500 hover:bg-orange-400 border-white text-white shadow-[0_8px_0_rgba(249,115,22,0.2)]')
                      }`}
                  >
                    {isLoading ? 'Executing...' : (editingId ? 'Update Mission' : 'Save Mission')}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </main>
    </div>
  );
}