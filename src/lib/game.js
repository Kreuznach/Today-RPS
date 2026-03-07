/**
 * lib/game.js
 * 게임 순수 로직 (UI 의존 없음)
 */

export function getComputerChoice() {
  const c = ['rock', 'scissors', 'paper'];
  return c[Math.floor(Math.random() * c.length)];
}

/** @returns {'win'|'lose'|'draw'} */
export function judgeResult(user, comp) {
  if (user === comp) return 'draw';
  if (
    (user === 'rock'     && comp === 'scissors') ||
    (user === 'scissors' && comp === 'paper')    ||
    (user === 'paper'    && comp === 'rock')
  ) return 'win';
  return 'lose';
}

export function buildStreakMessage(result, isRetry, streaks) {
  if (!streaks) return '';
  const msgs = [];
  if (result === 'win') {
    if (streaks.win_streak  > 1) msgs.push(`🏅 연속 승리 ${streaks.win_streak}회!`);
    if (streaks.total_wins  > 0) msgs.push(`🏆 총 승리 ${streaks.total_wins}회`);
    if (isRetry && streaks.retry_wins > 0) msgs.push(`🎲 광고 역전승 ${streaks.retry_wins}회`);
  } else if (result === 'lose' && streaks.lose_streak > 1) {
    msgs.push(`💀 연속 패배 ${streaks.lose_streak}회`);
  } else if (result === 'draw' && streaks.draw_streak > 1) {
    msgs.push(`🤝 연속 무승부 ${streaks.draw_streak}회`);
  }
  if (streaks.play_streak >= 20) msgs.push(`📅 ${streaks.play_streak}일 연속 출석 중!`);
  return msgs.join('  ·  ');
}

/** 날짜 포맷 */
export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'short',
  });
}

export function todayString() {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  ).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}

/** XSS 방지 */
export function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Confetti 생성 */
const CONFETTI_COLORS = ['#0064FF','#05C072','#FFB800','#FF3B3B','#D0E1FF'];
export function launchConfetti(container) {
  container.innerHTML = '';
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.cssText = [
      `left:${Math.random()*100}%`,
      `width:${6 + Math.random()*10}px`,
      `height:${6 + Math.random()*10}px`,
      `background:${CONFETTI_COLORS[Math.floor(Math.random()*CONFETTI_COLORS.length)]}`,
      `animation-duration:${1.2+Math.random()*1.8}s`,
      `animation-delay:${Math.random()*.5}s`,
      `border-radius:${Math.random()>.5?'50%':'2px'}`,
    ].join(';');
    container.appendChild(p);
  }
  setTimeout(() => { container.innerHTML = ''; }, 3200);
}
