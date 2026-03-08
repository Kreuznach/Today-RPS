/**
 * context/AppContext.jsx
 * 전역 앱 상태 (현재 뷰, 유저 ID, 오늘 상태, Toast)
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { getTossUserId } from '../lib/config.js';
import { getOrCreateUser, getTodayStatus } from '../lib/supabase.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [view,        setView]        = useState('loading');
  const [prevView,    setPrevView]    = useState(null);
  const [userId,      setUserId]      = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [toast,       setToast]       = useState({ msg: '', visible: false });
  const toastTimer = useRef(null);

  // ── Toast ────────────────────────────────────────
  const showToast = useCallback((msg, duration = 2500) => {
    clearTimeout(toastTimer.current);
    setToast({ msg, visible: true });
    toastTimer.current = setTimeout(
      () => setToast(t => ({ ...t, visible: false })),
      duration
    );
  }, []);

  // ── 뷰 전환 ──────────────────────────────────────
  const goTo = useCallback((nextView) => {
    setPrevView(v => v);
    setView(nextView);
  }, []);

  const goBack = useCallback(() => {
    setView(prevView ?? 'main');
  }, [prevView]);

  // ── 오늘 상태 새로고침 ────────────────────────────
  const refreshTodayStatus = useCallback(async (uid) => {
    try {
      const s = await getTodayStatus(uid ?? userId);
      setTodayStatus(s);
      return s;
    } catch (e) {
      console.error(e);
      return null;
    }
  }, [userId]);

  // ── 초기화 ────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const uid = await getTossUserId();
        setUserId(uid);
        await getOrCreateUser(uid);
        await refreshTodayStatus(uid);
      } catch (e) {
        console.error('초기화 오류:', e);
        showToast('서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.');
      } finally {
        setView('main');
      }
    })();
  }, []); // eslint-disable-line

  const value = {
    view, goTo, goBack,
    userId, todayStatus, setTodayStatus, refreshTodayStatus,
    toast, showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
