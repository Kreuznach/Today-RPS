/**
 * context/AppContext.jsx
 * 전역 앱 상태 (현재 뷰, 유저 ID, 오늘 상태, Toast)
 */
import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { getTossUserId } from '../lib/config.js';
import { getOrCreateUser, getTodayStatus, fetchMyStreaks, fetchDailyStats, getLocalKSTDate } from '../lib/supabase.js';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [view,        setView]        = useState('loading');
  const [prevView,    setPrevView]    = useState(null);
  const [userId,      setUserId]      = useState(null);
  const [todayStatus, setTodayStatus] = useState(null);
  const [streaks,     setStreaks]     = useState(null);
  const [dailyStats,  setDailyStats]  = useState(null);
  const [bootError,   setBootError]   = useState(null);
  const [online,      setOnline]      = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
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
    // 현재 view를 prevView에 저장하고 다음 view로 전환
    setView(currentView => {
      const currentKey = typeof currentView === 'string' ? currentView : currentView?.view;
      setPrevView(currentKey);
      return nextView;
    });
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

  const refreshExtras = useCallback(async (uid) => {
    const id = uid ?? userId;
    if (!id) return;
    try {
      const [s, d] = await Promise.all([
        fetchMyStreaks(id),
        fetchDailyStats(getLocalKSTDate()),
      ]);
      setStreaks(s);
      setDailyStats(d);
    } catch (e) {
      console.error(e);
    }
  }, [userId]);

  const boot = useCallback(async () => {
    setView('loading');
    setBootError(null);
    try {
      const uid = await getTossUserId();
      setUserId(uid);
      await getOrCreateUser(uid);
      await refreshTodayStatus(uid);
      await refreshExtras(uid);
      setView('main');
    } catch (e) {
      console.error('초기화 오류:', e);
      setBootError(e);
      setView('error');
    }
  }, [refreshTodayStatus, refreshExtras]);

  useEffect(() => {
    function onOnline() { setOnline(true); }
    function onOffline() { setOnline(false); }
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // ── 초기화 ────────────────────────────────────────
  useEffect(() => {
    boot();
  }, []); // eslint-disable-line

  const value = {
    view, goTo, goBack,
    userId, todayStatus, setTodayStatus, refreshTodayStatus, refreshExtras,
    streaks, dailyStats, bootError, online, retryBoot: boot,
    toast, showToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
