/**
 * views/MainView.jsx
 * 메인 화면 — 오늘 날짜, 남은 기회, 게임 시작
 */
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { CHOICE_EMOJI, watchAd, closeApp } from '../lib/config.js';
import { todayString } from '../lib/game.js';

export default function MainView() {
  const { goTo, userId, todayStatus, showToast } = useApp();
  const [adLoading, setAdLoading] = useState(false);

  const status = todayStatus;

  const {
    btnLabel, btnDisabled, dot0, dot1, chanceLabel, preview,
  } = useMemo(() => {
    if (!status || !status.playedToday) {
      return {
        btnLabel:    '게임 시작',
        btnDisabled: false,
        dot0:        'chance-chip active',
        dot1:        'chance-chip',
        chanceLabel: '오늘 1번 플레이 가능',
        preview:     null,
      };
    }

    const { latestRecord, hasUsedRetry, retryRecord } = status;
    const emoji = latestRecord ? (CHOICE_EMOJI[latestRecord.user_choice] ?? '') : '';
    const KR    = { win: '승리', lose: '패배', draw: '무승부' };
    const previewText = latestRecord
      ? `오늘 결과: ${emoji} ${KR[latestRecord.result] ?? ''}`
      : '오늘 플레이 완료';

    if (hasUsedRetry || retryRecord) {
      return {
        btnLabel:    '오늘 도전 완료',
        btnDisabled: true,
        dot0:        'chance-chip used',
        dot1:        'chance-chip used',
        chanceLabel: '내일 다시 만나요 👋',
        preview:     { text: previewText, cls: latestRecord?.result ?? '' },
      };
    }

    return {
      btnLabel:    '광고 보고 재도전',
      btnDisabled: false,
      dot0:        'chance-chip used',
      dot1:        'chance-chip retry',
      chanceLabel: '재도전 1회 가능 (광고 시청 후)',
      preview:     { text: previewText, cls: latestRecord?.result ?? '' },
    };
  }, [status]);

  async function handleStart() {
    if (!status?.playedToday) {
      goTo('game');
      return;
    }
    // 재도전 — 광고 시청
    setAdLoading(true);
    showToast('📺 광고를 불러오는 중…');
    const ok = await watchAd().catch(() => false);
    setAdLoading(false);
    if (!ok) { showToast('광고 시청을 완료해 주세요.'); return; }
    showToast('✅ 광고 시청 완료! 재도전 가능해요.');
    goTo('game-retry');
  }

  return (
    <div className="view active">
      {/* 최초 화면: 뒤로가기 = 앱 종료, 우측에 명예의 전당 아이콘 */}
      <header className="top-bar">
        <button
          className="icon-btn"
          aria-label="앱 종료"
          onClick={closeApp}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="app-title">오늘의 가위바위보</h1>
        <button
          className="icon-btn"
          aria-label="명예의 전당"
          onClick={() => goTo('hall-of-fame')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3h12v7a6 6 0 0 1-12 0V3z" />
            <path d="M4 6H2a1 1 0 0 0-1 1v1a4 4 0 0 0 4 3.87" />
            <path d="M20 6h2a1 1 0 0 1 1 1v1a4 4 0 0 1-4 3.87" />
            <path d="M12 16v4" />
            <path d="M9 20h6" />
          </svg>
        </button>
      </header>

      <main className="main-content">
        <div className="date-badge">{todayString()}</div>

        <div className="hero-card">
          <span className="hero-hands" aria-hidden="true">✊ ✌️ 🖐️</span>
          <p className="hero-sub">오늘의 운을 시험해 보세요!</p>
        </div>

        <div className="chance-slots" aria-label="남은 기회">
          <div className={dot0} aria-label="1회차">1회</div>
          <div className={dot1} aria-label="재도전">재도전</div>
        </div>
        <p className="chance-label">{chanceLabel}</p>

        {preview && (
          <div className={`today-result-preview ${preview.cls}`}>
            {preview.text}
          </div>
        )}

        <button
          className="btn-primary btn-xl"
          disabled={btnDisabled || adLoading}
          onClick={handleStart}
          style={{ marginTop: 'auto' }}
        >
          {adLoading ? '광고 로딩 중…' : btnLabel}
        </button>

        {/* 내 기록 링크 — 헤더 아이콘 제거 후 콘텐츠 영역으로 이동 */}
        <button
          className="link-btn"
          aria-label="내 기록 보기"
          onClick={() => goTo('my-records')}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
          내 기록 보기
        </button>
      </main>
    </div>
  );
}
