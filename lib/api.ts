"use client";

// =========================================================================
// 🌟 API Client กลางของ KeyRush (Cookie-based Auth)
// - ยิงแบบ same-origin (/api/*) ผ่าน rewrite proxy ใน next.config.ts เสมอ
//   เพื่อให้ cookie เป็น first-party — JS จึงอ่าน csrf_token ได้ (ยิงตรงข้ามโดเมนจะอ่านไม่ได้)
// - แนบ X-CSRF-Token อัตโนมัติให้ทุก POST/PUT/DELETE/PATCH (double-submit cookie)
// - เจอ 401 ระหว่างใช้งาน → เคลียร์ user state แล้วพาไปหน้า /login
// =========================================================================

const MUTATING_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

// อ่านค่า csrf_token จาก cookie (ตัวนี้ไม่ HttpOnly ตั้งใจให้ JS อ่านได้)
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// เคลียร์ข้อมูล user ฝั่ง client (เหลือแค่ display cache — token อยู่ใน HttpOnly cookie ไม่ต้องยุ่ง)
export function clearUserState() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('keyrush_user');
}

function handleUnauthorized() {
  clearUserState();
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

interface ApiFetchOptions {
  // ปิดการ redirect อัตโนมัติเมื่อเจอ 401 (ใช้กับหน้า public ที่แค่อยากรู้สถานะ login)
  redirectOn401?: boolean;
}

// fetch wrapper กลาง — ทุก request ที่ยิงไป backend ต้องผ่านฟังก์ชันนี้เท่านั้น
export async function apiFetch(
  path: string,
  init: RequestInit = {},
  { redirectOn401 = true }: ApiFetchOptions = {}
): Promise<Response> {
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers);

  if (MUTATING_METHODS.includes(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers.set('X-CSRF-Token', csrf);
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && redirectOn401) {
    handleUnauthorized();
  }

  return res;
}

// Logout: ให้ server revoke token + เคลียร์ cookie แล้วค่อยเคลียร์ state ฝั่ง client
export async function logout(): Promise<void> {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' }, { redirectOn401: false });
  } catch (e) {
    // ต่อ backend ไม่ได้ก็ยังต้องเคลียร์ฝั่ง client อยู่ดี
    console.warn('Logout request failed', e);
  }
  clearUserState();
}
