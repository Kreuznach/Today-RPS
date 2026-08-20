/**
 * views/MyRecordsView.jsx
 * 내 기록 — 누적 통계 + 연속 기록
 */
import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import {
  getOrCreateUser, fetchMyStreaks, fetchSeasonStreaks, fetchMyRecords,
  fetchMyBadges, updateNickname, updateTeamColor, getLocalKSTDate,
} from '../lib/supabase.js';
import { formatDate } from '../lib/game.js';
import {
  BADGE_CATALOG, TEAM_COLORS, validateNickname, summarizeHabits,
  summarizeWeek, monthQuest, playStreakDday, currentSeason,
} from '../lib/content.js';

function weekStartKst() {
  const today = getLocalKSTDate();
  const [y, m, d] = today.split('-').map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const start = new Date(Date.UTC(y, m - 1, d - wd));
  const yy = start.getUTCFullYear();
  const mm = String(start.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(start.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export default function MyRecordsView() {
  const { userId, showToast } = useApp();
  const [user,    setUser]    = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [season,  setSeason]  = useState(null);
  const [records, setRecords] = useState([]);
  const [weekRec, setWeekRec] = useState([]);
  const [badges,  setBadges]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [nickDraft, setNickDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!userId) return undefined;
    setLoading(true);
    Promise.all([
      getOrCreateUser(userId),
      fetchMyStreaks(userId),
      fetchSeasonStreaks(userId),
      fetchMyRecords(userId),
      fetchMyRecords(userId, weekStartKst()),
      fetchMyBadges(userId),
    ])
      .then(([u, s, ss, rec, week, b]) => {
        if (cancelled) return;
        setUser(u); setStreaks(s); setSeason(ss);
        setRecords(rec); setWeekRec(week); setBadges(b);
      })
      .catch((e) => { console.error(e); showToast('기록을 불러오지 못했어요.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  const total   = streaks?.total_plays   ?? 0;
  const wins    = streaks?.total_wins    ?? 0;
  const losses  = streaks?.total_losses  ?? 0;
  const draws   = streaks?.total_draws   ?? 0;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const habits = summarizeHabits(records);
  const week = summarizeWeek(weekRec);
  const quest = monthQuest(season);
  const owned = new Set(badges.map((b) => b.badge_key));
  const nickLocked = user?.nickname_updated_on === getLocalKSTDate();

  async function handleSaveNick() {
    const v = validateNickname(nickDraft);
    if (!v.ok) { showToast(v.reason); return; }
    setSaving(true);
    try {
      const next = await updateNickname(userId, v.name);
      setUser(next);
      setEditing(false);
      showToast('이름을 바꿨어요. 내일 다시 바꿀 수 있어요.');
    } catch (e) {
      const msg = String(e?.message ?? '');
      showToast(msg.includes('NICK_LIMIT') ? '오늘은 이미 이름을 바꿨어요.' : '이름을 저장하지 못했어요.');
    } finally {
      setSaving(false);
    }
  }

  async function handleTeam(color) {
    try {
      const next = await updateTeamColor(userId, color);
      setUser(next);
      showToast('응원 색을 골랐어요. 채팅은 없어요.');
    } catch (e) {
      console.error(e);
      showToast('응원 색을 저장하지 못했어요.');
    }
  }

  return (
    <div className="view active">
      <TopBar title="내 기록" />

      <main className="records-content">
        {/* 유저 카드 */}
        <div className="user-card">
          <div className="user-avatar">😎</div>
          <div className="user-card-body">
            {editing ? (
              <div className="nick-edit">
                <input
                  className="nick-input"
                  maxLength={12}
                  value={nickDraft}
                  onChange={(e) => setNickDraft(e.target.value)}
                  aria-label="새 닉네임"
                />
                <button className="btn-mini" disabled={saving} onClick={handleSaveNick}>저장</button>
                <button className="btn-mini ghost" onClick={() => setEditing(false)}>취소</button>
              </div>
            ) : (
              <p className="user-name">
                {loading ? '로딩 중…' : (user?.nickname ?? '익명 플레이어')}
              </p>
            )}
            {user?.created_at && (
              <p className="user-join">{formatDate(user.created_at)} 가입</p>
            )}
            {!editing && (
              <button
                className="btn-mini ghost"
                disabled={nickLocked}
                onClick={() => { setNickDraft(user?.nickname ?? ''); setEditing(true); }}
              >
                {nickLocked ? '오늘은 이미 바꿈' : '이름 바꾸기'}
              </button>
            )}
          </div>
        </div>

        <p className="hint-line">{playStreakDday(streaks?.play_streak)}</p>

        <section className="records-section">
          <h2 className="section-title">응원 색</h2>
          <div className="team-row">
            {TEAM_COLORS.map(({ key, label }) => (
              <button
                key={key}
                className={`team-chip team-${key}${user?.team_color === key ? ' on' : ''}`}
                onClick={() => handleTeam(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

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

        <section className="records-section">
          <h2 className="section-title">손 버릇</h2>
          <p className="hint-line">{habits.favoriteLabel}</p>
          <div className="habit-bars">
            {[
              ['가위', habits.percents.scissors],
              ['바위', habits.percents.rock],
              ['보', habits.percents.paper],
            ].map(([label, pct]) => (
              <div className="habit-row" key={label}>
                <span>{label}</span>
                <div className="habit-track"><div className="habit-fill" style={{ width: `${pct}%` }} /></div>
                <span>{pct}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="records-section">
          <h2 className="section-title">이번 주 리캡</h2>
          <p className="hint-line">
            {week.total
              ? `${week.wins}승 ${week.losses}패 ${week.draws}무 · 최장 ${week.maxWin}연승`
              : '이번 주 기록이 아직 없어요.'}
          </p>
        </section>

        <section className="records-section">
          <h2 className="section-title">{quest.title}</h2>
          <p className="hint-line">{quest.done ? '완료!' : `${quest.current} / ${quest.goal}`}</p>
          <p className="hint-line muted">이달 {currentSeason()} · 새 게임이 아니라 같은 기록의 목표예요.</p>
        </section>

        <section className="records-section">
          <h2 className="section-title">배지</h2>
          <div className="badge-grid">
            {BADGE_CATALOG.map((b) => (
              <div key={b.key} className={`badge-card${owned.has(b.key) ? ' on' : ''}`}>
                <p className="badge-name">{b.name}</p>
                <p className="badge-desc">{owned.has(b.key) ? b.desc : '아직 없음'}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
