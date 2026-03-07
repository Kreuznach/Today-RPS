/**
 * views/GameView.jsx
 * 게임 화면 — 가위/바위/보 선택 & 애니메이션
 */
import React, { useState, useRef } from 'react';
import TopBar from '../components/TopBar.jsx';
import { useApp } from '../context/AppContext.jsx';
import { CHOICE_EMOJI } from '../lib/config.js';
import { getComputerChoice, judgeResult } from '../lib/game.js';
import { saveGameRecord, fetchMyStreaks } from '../lib/supabase.js';

const THINKING_FRAMES = ['🤔', '😤', '🙄', '🧐'];

export default function GameView({ isRetry = false }) {
  const { goTo, userId, setTodayStatus, showToast } = useApp();

  const [playerHand,  setPlayerHand]  = useState('❓');
  const [compHand,    setCompHand]    = useState('❓');
  const [playerCls,   setPlayerCls]   = useState('');
  const [compCls,     setCompCls]     = useState('');
  const [disabled,    setDisabled]    = useState(false);
  const [prompt,      setPrompt]      = useState(isRetry ? '재도전! 무엇을 낼까요?' : '무엇을 낼까요?');
  const [cntWidth,    setCntWidth]    = useState(100);
  const [showCnt,     setShowCnt]     = useState(false);

  const thinkingRef = useRef(null);
  const cntTimer    = useRef(null);

  function startCountdown(ms) {
    setShowCnt(true); setCntWidth(100);
    // rAF trick: set to 100% then transition to 0%
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setCntWidth(0));
    });
    cntTimer.current = setTimeout(() => setShowCnt(false), ms + 50);
  }

  async function handleChoice(userChoice) {
    if (disabled) return;
    setDisabled(true);

    setPlayerHand(CHOICE_EMOJI[userChoice]);
    setPlayerCls('shake');
    startCountdown(900);

    let frame = 0;
    thinkingRef.current = setInterval(() => {
      setCompHand(THINKING_FRAMES[frame++ % THINKING_FRAMES.length]);
    }, 180);
    setPrompt('컴퓨터가 고르는 중…');

    await sleep(900);
    clearInterval(thinkingRef.current);

    const compChoice = getComputerChoice();
    const result     = judgeResult(userChoice, compChoice);
    const compResult = result === 'win' ? 'lose' : result === 'lose' ? 'win' : 'draw';

    setCompHand(CHOICE_EMOJI[compChoice]);
    setCompCls('shake');

    setTimeout(() => {
      setPlayerCls(result);
      setCompCls(compResult);
    }, 300);

    setPrompt(
      result === 'win' ? '🎉 이겼어요!' :
      result === 'lose' ? '😢 졌어요…' :
      '🤝 무승부!'
    );

    let streaks = null;
    try {
      await saveGameRecord(userId, userChoice, compChoice, result, isRetry);
      streaks = await fetchMyStreaks(userId);
      // TodayStatus 캐시 무효화 (홈으로 돌아갈 때 재조회)
      setTodayStatus(null);
    } catch (e) {
      console.error('[saveGameRecord error]', e);
      // 에러 코드를 토스트에 표시 — 원인 파악 후 일반 메시지로 교체
      const code = e?.code ?? e?.details ?? e?.message ?? '알 수 없음';
      showToast(`기록 저장 중 문제가 발생했어요. [${String(code).slice(0, 40)}]`, 5000);
    }

    await sleep(800);
    goTo({ view: 'result', state: { userChoice, compChoice, result, isRetry, streaks } });
  }

  return (
    <div className="view active">
      <TopBar
        title={isRetry ? '재도전 🔥' : '가위 바위 보!'}
        onBack={() => goTo('main')}
      />

      <main className="game-content">
        <div className="vs-area">
          <div className="player-side">
            <div className={`hand-display ${playerCls}`}>{playerHand}</div>
            <span className="hand-label">나</span>
          </div>
          <span className="vs-badge">VS</span>
          <div className="player-side">
            <div className={`hand-display ${compCls}`}>{compHand}</div>
            <span className="hand-label">컴퓨터</span>
          </div>
        </div>

        <p className="pick-prompt">{prompt}</p>

        <div className="choices" role="group" aria-label="가위바위보 선택">
          {[
            { key: 'scissors', label: '가위' },
            { key: 'rock',     label: '바위' },
            { key: 'paper',    label: '보'   },
          ].map(({ key, label }) => (
            <button
              key={key}
              className="choice-btn"
              aria-label={label}
              disabled={disabled}
              onClick={() => handleChoice(key)}
            >
              <span className="choice-emoji">{CHOICE_EMOJI[key]}</span>
              <span className="choice-name">{label}</span>
            </button>
          ))}
        </div>

        {showCnt && (
          <div className="countdown-bar">
            <div
              className="countdown-fill"
              style={{
                width: `${cntWidth}%`,
                transition: cntWidth === 0 ? 'width 900ms linear' : 'none',
              }}
            />
          </div>
        )}
      </main>
    </div>
  );
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
