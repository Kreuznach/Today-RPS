/**
 * views/HallOfFameView.jsx
 * 명예의 전당 — 카테고리 탭 & TOP 10 / 이달
 */
import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import { HOF_CATEGORIES, HOF_UNITS } from '../lib/config.js';
import { fetchHallOfFame, fetchMyRank } from '../lib/supabase.js';
import { formatDate } from '../lib/game.js';
import { currentSeason, SEASON_PLAY_STREAK_MIN } from '../lib/content.js';

const RANK_EMOJI = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

export default function HallOfFameView() {
  const { showToast, userId } = useApp();
  const [activeCat, setActiveCat] = useState('win_streak');
  const [scope,     setScope]     = useState('all'); // all | season
  const [rows,      setRows]      = useState(null); // null = loading
  const [myRank,    setMyRank]    = useState(null);
  const season = currentSeason();

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setMyRank(null);
    const seasonKey = scope === 'season' ? season : null;
    Promise.all([
      fetchHallOfFame(activeCat, seasonKey),
      userId ? fetchMyRank(userId, activeCat, seasonKey).catch(() => null) : Promise.resolve(null),
    ])
      .then(([data, rank]) => {
        if (cancelled) return;
        setRows(data);
        setMyRank(rank);
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setRows([]);
        showToast('랭킹을 불러오지 못했어요.');
      });
    return () => { cancelled = true; };
  }, [activeCat, scope, userId, season]);

  return (
    <div className="view active hof-view">
      <TopBar title="명예의 전당" />

      <div className="hof-scope" role="tablist" aria-label="기간">
        <button
          className={`hof-tab${scope === 'all' ? ' active' : ''}`}
          onClick={() => setScope('all')}
        >
          통산
        </button>
        <button
          className={`hof-tab${scope === 'season' ? ' active' : ''}`}
          onClick={() => setScope('season')}
        >
          이달 {season}
        </button>
      </div>

      <nav className="hof-tabs" role="tablist" aria-label="명예의 전당 카테고리">
        {HOF_CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            className={`hof-tab${activeCat === key ? ' active' : ''}`}
            role="tab"
            aria-selected={activeCat === key}
            onClick={() => setActiveCat(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {activeCat === 'play_streak' && (
        <p className="hof-min-label">
          {scope === 'season'
            ? `이달은 ${SEASON_PLAY_STREAK_MIN}일 이상만 집계됩니다`
            : '최소 10일 이상 기록만 집계됩니다'}
        </p>
      )}
      {myRank && (
        <p className="hof-my-rank">
          {myRank.rank
            ? `내 순위 ${myRank.rank}위 · ${myRank.record}`
            : myRank.min_needed
              ? `아직 순위 밖 · ${myRank.record} (집계 ${myRank.min_needed}부터)`
              : `아직 순위 밖 · ${myRank.record}`}
        </p>
      )}

      <main className="hof-content">
        <div className="hof-list" role="list" aria-live="polite">
          {rows === null ? (
            <div className="hof-loading"><div className="spinner" /></div>
          ) : rows.length === 0 ? (
            <p className="hof-empty">아직 기록이 없어요.<br />첫 번째 전설이 되어 보세요!</p>
          ) : (
            rows.map((row, i) => (
              <div
                key={row.rank}
                className={`hof-item${row.user_id === userId ? ' hof-item--me' : ''}`}
                role="listitem"
                style={{ '--i': i }}
              >
                {row.user_id === userId && (
                  <span className="hof-me-badge">👑 나</span>
                )}
                <div className={`hof-rank rank-${Math.min(row.rank, 10)}`}>
                  {RANK_EMOJI[i] ?? row.rank}
                </div>
                <div className="hof-info">
                  <p className="hof-name">{row.users?.nickname ?? '익명'}</p>
                  <p className="hof-date">{formatDate(row.achieved_at)} 달성</p>
                </div>
                <div>
                  <span className="hof-record">{row.record.toLocaleString()}</span>
                  <span className="hof-unit">{HOF_UNITS[activeCat] ?? ''}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
