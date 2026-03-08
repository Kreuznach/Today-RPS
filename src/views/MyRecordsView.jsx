/**
 * views/MyRecordsView.jsx
 * 내 기록 — 누적 통계 + 연속 기록
 */
import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import { getOrCreateUser, fetchMyStreaks } from '../lib/supabase.js';
import { formatDate } from '../lib/game.js';

export default function MyRecordsView() {
  const { userId, showToast } = useApp();
  const [user,    setUser]    = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getOrCreateUser(userId), fetchMyStreaks(userId)])
      .then(([u, s]) => { if (!cancelled) { setUser(u); setStreaks(s); } })
      .catch(e => { console.error(e); showToast('기록을 불러오지 못했어요.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const total   = streaks?.total_plays   ?? 0;
  const wins    = streaks?.total_wins    ?? 0;
  const losses  = streaks?.total_losses  ?? 0;
  const draws   = streaks?.total_draws   ?? 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="view active">
      <TopBar title="내 기록" />

      <main className="records-content">
        {/* 유저 카드 */}
        <div className="user-card">
          <div className="user-avatar">😎</div>
          <div>
            <p className="user-name">
              {loading ? '로딩 중…' : (user?.nickname ?? '익명 플레이어')}
            </p>
            {user?.created_at && (
              <p className="user-join">{formatDate(user.created_at)} 가입</p>
            )}
          </div>
        </div>

        {/* 누적 통계 */}
        <section className="records-section">
          <h2 className="section-title">누적 통계</h2>
          <div className="stats-grid">
            <div className="stat-card blue">
              <span className="stat-value">{total.toLocaleString()}</span>
              <span className="stat-label">총 플레이</span>
            </div>
            <div className="stat-card green">
              <span className="stat-value">{wins.toLocaleString()}</span>
              <span className="stat-label">승리</span>
            </div>
            <div className="stat-card red">
              <span className="stat-value">{losses.toLocaleString()}</span>
              <span className="stat-label">패배</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{draws.toLocaleString()}</span>
              <span className="stat-label">무승부</span>
            </div>
          </div>

          <div className="win-rate-bar-wrap">
            <div className="win-rate-bar" style={{ width: `${winRate}%` }} />
            <span className="win-rate-label">승률 {winRate}%</span>
          </div>
        </section>

        {/* 연속 기록 */}
        <section className="records-section">
          <h2 className="section-title">나의 연속 기록 (최고)</h2>
          <div className="streak-list">
            {[
              { icon: '🏅', label: '연속 승리',   val: `${streaks?.max_win_streak  ?? 0}연승` },
              { icon: '💀', label: '연속 패배',   val: `${streaks?.max_lose_streak ?? 0}연패` },
              { icon: '🤝', label: '연속 무승부', val: `${streaks?.max_draw_streak ?? 0}연무` },
              { icon: '📅', label: '연속 출석',   val: `${streaks?.max_play_streak ?? 0}일`, minLabel: '10일 이상' },
              { icon: '🎲', label: '광고 역전승', val: `${streaks?.retry_wins      ?? 0}회` },
            ].map(({ icon, label, val, minLabel }) => (
              <div className="streak-row" key={label}>
                <span className="streak-icon">{icon}</span>
                <span className="streak-name">
                  {label}
                  {minLabel && <span className="streak-min-label">{minLabel}</span>}
                </span>
                <span className="streak-val">{val}</span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
