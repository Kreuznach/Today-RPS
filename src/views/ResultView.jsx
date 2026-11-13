/**
 * views/ResultView.jsx
 * 결과 화면 — 승/패/무, 컨페티, 광고 재도전
 */
import React, { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { CHOICE_EMOJI, RESULT_MAP, watchAd } from '../lib/config.js';
import { buildStreakMessage, launchConfetti } from '../lib/game.js';
import { fortuneCopy, worldWinLine, weekThemeHand, nextGoalLine } from '../lib/content.js';
import { shareResultCard } from '../lib/share.js';

export default function ResultView({ state }) {
  const { goTo, refreshTodayStatus, dailyStats, showToast } = useApp();
  const burstRef   = useRef(null);
  const [adLoading, setAdLoading] = useState(false);

  const { userChoice, compChoice, result, isRetry, streaks } = state ?? {};
  const info         = RESULT_MAP[result] ?? RESULT_MAP['draw'];
  const streakMsg    = buildStreakMessage(result, isRetry, streaks);
  const showAdRetry  = !isRetry && result !== 'win';
  const week = weekThemeHand();
  const world = worldWinLine(dailyStats);
  const goal = nextGoalLine(streaks);

  // Confetti
  useEffect(() => {
    if (result === 'win' && burstRef.current) {
      launchConfetti(burstRef.current);
    }
  }, [result]);

  async function handleAdRetry() {
    setAdLoading(true);
    showToast('📺 광고를 불러오는 중…');
    const ok = await watchAd().catch(() => false);
    setAdLoading(false);
    if (!ok) { showToast('광고 시청을 완료해 주세요.'); return; }
    showToast('✅ 재도전 기회를 획득했어요!');
    goTo({ view: 'game-retry', state: null });
  }

  async function handleHome() {
    // 최신 상태 재조회 후 메인으로
    try { await refreshTodayStatus(); } catch (_) {}
    goTo('main');
  }

  return (
    <div className="view active">
      <main className="result-content">
        <div className="result-burst" ref={burstRef} aria-hidden="true" />

        <div className="result-card">
          <div className="result-emoji">{info.emoji}</div>
          <h2 className={`result-title ${info.cls}`}>{info.title}</h2>
          <p className="result-sub">{info.sub}</p>
          <p className="result-fortune">{fortuneCopy(result)}</p>
        </div>

        <div className="result-matchup">
          <div className="matchup-item">
            <div className="matchup-hand">{CHOICE_EMOJI[userChoice]}</div>
            <span className="matchup-label">나</span>
          </div>
          <span className="matchup-vs">VS</span>
          <div className="matchup-item">
            <div className="matchup-hand">{CHOICE_EMOJI[compChoice]}</div>
            <span className="matchup-label">컴퓨터</span>
          </div>
        </div>

        {streakMsg && (
          <div className="streak-update" aria-live="polite">{streakMsg}</div>
        )}
        {isRetry && result === 'win' && streaks?.retry_wins > 0 && (
          <p className="hint-line">🎲 광고 역전 {streaks.retry_wins}회째</p>
        )}
        {result === 'win' && userChoice === week.hand && (
          <p className="hint-line">{week.label} 손으로 이겼어요. 점수는 그대로, 배지만 받아요.</p>
        )}
        {world && <p className="hint-line muted">{world}</p>}
        {goal && <p className="next-goal">{goal}</p>}

        <button
          className="btn-secondary"
          onClick={async () => {
            const r = await shareResultCard({
              result, userChoice, compChoice,
              winStreak: streaks?.win_streak ?? 0,
            }).catch(() => 'unsupported');
            if (r === 'copied') showToast('공유 문장을 복사했어요.');
            else if (r === 'unsupported') showToast('이 기기에서는 공유를 쓸 수 없어요.');
          }}
        >
          오늘 결과 공유
        </button>

        {showAdRetry && (
          <div className="ad-retry-section">
            <p className="ad-hint">결과가 마음에 안 드시나요?</p>
            <button className="btn-ad" onClick={handleAdRetry} disabled={adLoading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
              </svg>
              {adLoading ? '광고 로딩 중…' : '광고 보고 재도전'}
            </button>
            <p className="ad-hint small">광고 시청 후 재도전 시 오늘의 시도횟수는 합산 2회로 기록됩니다.</p>
            <p className="ad-hint small">재도전 후 결과는 강제 적용됩니다</p>
          </div>
        )}

        <button
          className="btn-primary"
          onClick={handleHome}
          style={{ marginTop: 'auto' }}
        >
          홈으로
        </button>
      </main>
    </div>
  );
}
