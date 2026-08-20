/**
 * App.jsx
 * 최상위 컴포넌트 — 뷰 라우팅 + 전환 애니메이션
 *
 * 뷰 키:
 *   'loading'      — 초기 스플래시
 *   'error'        — 연결 실패
 *   'main'         — 메인
 *   'game'         — 게임 (최초)
 *   'game-retry'   — 재도전 게임
 *   'result'       — 결과
 *   'hall-of-fame' — 명예의 전당
 *   'my-records'   — 내 기록
 */
import React, { useEffect, useRef, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.jsx';
import Toast from './components/Toast.jsx';
import ErrorScreen    from './components/ErrorScreen.jsx';
import MainView       from './views/MainView.jsx';
import GameView       from './views/GameView.jsx';
import ResultView     from './views/ResultView.jsx';
import HallOfFameView from './views/HallOfFameView.jsx';
import MyRecordsView  from './views/MyRecordsView.jsx';
import { closeApp } from './lib/config.js';

// ─────────────────────────────────────────────────────────────
// 뷰 전환 래퍼 (CSS 트랜지션)
// ─────────────────────────────────────────────────────────────
function ViewRouter() {
  const { view: rawView, goTo, goBack, online, retryBoot } = useApp();

  // view 값은 string 또는 { view, state } 객체
  const viewKey   = typeof rawView === 'string' ? rawView : rawView?.view;
  const viewState = typeof rawView === 'string' ? null    : rawView?.state;

  const [displayed, setDisplayed] = useState(viewKey);
  const [state,     setState]     = useState(viewState);
  const [cls,       setCls]       = useState('active');
  const prevKey = useRef(viewKey);

  // Android 하드웨어 백버튼 처리:
  // 더미 history 엔트리를 유지해 popstate 가 항상 발화하도록 합니다.
  const displayedRef = useRef(displayed);
  useEffect(() => { displayedRef.current = displayed; }, [displayed]);

  useEffect(() => {
    // 초기 더미 엔트리 push
    window.history.pushState(null, '');

    function onPopState() {
      const cur = displayedRef.current;
      if (cur === 'main' || cur === 'loading') {
        // 최초 화면 → 앱 종료
        closeApp();
      } else {
        // 하위 화면 → 이전 화면으로 이동
        goBack();
      }
      // 다음 뒤로가기를 위해 더미 엔트리 재push
      window.history.pushState(null, '');
    }

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [goBack]);

  useEffect(() => {
    if (viewKey === prevKey.current) return;
    // 나가는 애니메이션
    setCls('exit');
    const t = setTimeout(() => {
      prevKey.current = viewKey;
      setDisplayed(viewKey);
      setState(viewState);
      setCls('active');
    }, 280);
    return () => clearTimeout(t);
  }, [viewKey, viewState]);

  function renderView() {
    switch (displayed) {
      case 'loading':      return <LoadingView />;
      case 'error':        return <ErrorScreen online={online} onRetry={retryBoot} />;
      case 'main':         return <MainView />;
      case 'game':         return <GameView isRetry={false} />;
      case 'game-retry':   return <GameView isRetry={true}  />;
      case 'result':       return <ResultView state={state} />;
      case 'hall-of-fame': return <HallOfFameView />;
      case 'my-records':   return <MyRecordsView />;
      default:             return <MainView />;
    }
  }

  return (
    <div className="app-shell">
      <div className={`view ${cls}`} style={{ position: 'absolute', inset:0, display:'flex', flexDirection:'column' }}>
        {renderView()}
      </div>
      <Toast />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 로딩 스플래시
// ─────────────────────────────────────────────────────────────
function LoadingView() {
  return (
    <div className="view-loading" style={{ flex:1, display:'flex', justifyContent:'center', alignItems:'center' }}>
      <div className="splash">
        <div className="splash-icon">✊</div>
        <p className="splash-text">하루 한 번 가위바위보</p>
        <div className="spinner" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Root
// ─────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <ViewRouter />
    </AppProvider>
  );
}
