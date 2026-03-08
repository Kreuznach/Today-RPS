/**
 * views/HallOfFameView.jsx
 * 명예의 전당 — 카테고리 탭 & TOP 5 랭킹
 */
import React, { useState, useEffect } from 'react';
import TopBar from '../components/TopBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import { HOF_CATEGORIES, HOF_UNITS } from '../lib/config.js';
import { fetchHallOfFame } from '../lib/supabase.js';
import { formatDate, escHtml } from '../lib/game.js';

const RANK_EMOJI = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

export default function HallOfFameView() {
  const { showToast, userId } = useApp();
  const [activeCat, setActiveCat] = useState('win_streak');
  const [rows,      setRows]      = useState(null); // null = loading

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    fetchHallOfFame(activeCat)
      .then(data => { if (!cancelled) setRows(data); })
      .catch(e  => { console.error(e); if (!cancelled) setRows([]); showToast('랭킹을 불러오지 못했어요.'); });
    return () => { cancelled = true; };
  }, [activeCat]);

  return (
    <div className="view active">
      <TopBar title="명예의 전당" />

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

      {HOF_CATEGORIES.find(c => c.key === activeCat)?.minLabel && (
        <p className="hof-min-label">
          최소 {HOF_CATEGORIES.find(c => c.key === activeCat).minLabel} 기록만 집계됩니다
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
                <div className={`hof-rank rank-${row.rank}`}>
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
