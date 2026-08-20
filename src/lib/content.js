/**
 * lib/content.js
 * 화면 문구·테마·기록 읽기 (확률은 바꾸지 않음)
 */

export const APP_VERSION = '0.14.0';
export const PLAY_STREAK_HOF_MIN = 10;
export const SEASON_PLAY_STREAK_MIN = 3;

const HANDS = ['rock', 'scissors', 'paper'];
const HAND_KR = { rock: '바위', scissors: '가위', paper: '보' };

const BANNED_NICK = [
  '관리자', '운영자', 'official', 'admin', 'administrator',
  'system', 'sysop', 'moderator',
];

export function validateNickname(raw) {
  const name = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (name.length < 2 || name.length > 12) {
    return { ok: false, reason: '이름은 2~12글자로 적어 주세요.' };
  }
  if (!/^[\p{L}\p{N} ._-]+$/u.test(name)) {
    return { ok: false, reason: '한글, 영어, 숫자와 일부 기호만 쓸 수 있어요.' };
  }
  const compact = name.toLowerCase().replace(/\s+/g, '');
  if (BANNED_NICK.some((w) => compact.includes(w))) {
    return { ok: false, reason: '그 이름은 쓸 수 없어요.' };
  }
  return { ok: true, name };
}

export function kstWeekday(date = new Date()) {
  const w = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul', weekday: 'short',
  }).format(date);
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[w] ?? 0;
}

export function currentSeason(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit',
  }).formatToParts(date);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  return `${y}-${m}`;
}

export function weekdayTheme(weekday = kstWeekday()) {
  const themes = [
    { key: 'sun', name: '일요일 느긋보', hero: '오늘은 천천히, 손 하나만.', hint: '휴일에도 하루 한 판' },
    { key: 'mon', name: '월요일 출근보', hero: '출근길 운을 한 번만 시험해 보세요.', hint: '월요일도 손 하나' },
    { key: 'tue', name: '화요일 집중보', hero: '오늘은 조금 더 또렷하게.', hint: '화요일 한 판' },
    { key: 'wed', name: '수요일 중간보', hero: '한 주의 가운데, 손 하나.', hint: '수요일 한 판' },
    { key: 'thu', name: '목요일 도약보', hero: '주말이 보이기 시작했어요.', hint: '목요일 한 판' },
    { key: 'fri', name: '금요일 불금보', hero: '불금에도 규칙은 하루 한 판.', hint: '금요일 한 판' },
    { key: 'sat', name: '토요일 나들이보', hero: '쉬는 날의 작은 승부.', hint: '토요일 한 판' },
  ];
  return themes[weekday] ?? themes[0];
}

/** 표시만. 실제 컴퓨터 손은 공정 난수를 씁니다. */
export function todayHandHint(dateStr) {
  let h = 0;
  for (let i = 0; i < String(dateStr).length; i++) {
    h = (h * 33 + dateStr.charCodeAt(i)) >>> 0;
  }
  const hand = HANDS[h % 3];
  return {
    hand,
    text: `오늘의 기운: ${HAND_KR[hand]} 쪽이 설렌다 (힌트일 뿐, 확률은 같아요)`,
  };
}

export function weekThemeHand(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const d = Number(parts.find((p) => p.type === 'day')?.value);
  const utc = Date.UTC(y, m - 1, d);
  const week = Math.floor(utc / 604800000);
  const hand = HANDS[week % 3];
  return {
    hand,
    label: `이번 주는 ${HAND_KR[hand]} 주간`,
    hint: `${HAND_KR[hand]}로 이기면 이번 주 배지를 받을 수 있어요. 승패 점수는 그대로입니다.`,
  };
}

export function fortuneCopy(result) {
  if (result === 'win')  return '오늘의 운세: 작은 용기가 통하는 날';
  if (result === 'lose') return '오늘의 운세: 아껴 둔 운이 내일로 미뤄진 날';
  return '오늘의 운세: 밀고 당기기가 팽팽한 날';
}

export function playStreakDday(playStreak = 0) {
  const left = PLAY_STREAK_HOF_MIN - Number(playStreak || 0);
  if (left > 0) return `연속 출석 집계까지 ${left}일 (10일부터 명예의 전당)`;
  return `연속 출석 ${playStreak}일 — 명예의 전당에 올라갈 수 있어요`;
}

export function streakWarning({ playStreak = 0, winStreak = 0, playedToday = false } = {}) {
  if (playedToday) return '';
  if (winStreak >= 2) return `오늘 안 하면 ${winStreak}연승이 끊겨요`;
  if (playStreak >= 2) return `오늘 안 하면 ${playStreak}일 출석이 끊겨요`;
  return '';
}

export function summarizeHabits(records = []) {
  const counts = { rock: 0, scissors: 0, paper: 0 };
  for (const r of records) {
    if (counts[r.user_choice] != null) counts[r.user_choice] += 1;
  }
  const total = counts.rock + counts.scissors + counts.paper;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const favorite = total
    ? Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    : null;
  return {
    total,
    counts,
    percents: { rock: pct(counts.rock), scissors: pct(counts.scissors), paper: pct(counts.paper) },
    favorite,
    favoriteLabel: favorite ? `${HAND_KR[favorite]}를 가장 많이 냈어요` : '아직 손 버릇이 없어요',
  };
}

export function summarizeWeek(records = []) {
  let wins = 0, losses = 0, draws = 0, streak = 0, maxWin = 0;
  const sorted = [...records].sort((a, b) => String(a.played_at).localeCompare(String(b.played_at)));
  for (const r of sorted) {
    if (r.result === 'win') {
      wins += 1; streak += 1; maxWin = Math.max(maxWin, streak);
    } else {
      if (r.result === 'lose') losses += 1;
      if (r.result === 'draw') draws += 1;
      streak = 0;
    }
  }
  return { wins, losses, draws, maxWin, total: records.length };
}

export function worldWinLine(stats) {
  if (!stats || !stats.total_plays) return '';
  const pct = Math.round((stats.wins / stats.total_plays) * 100);
  return `오늘 이 앱에서 이긴 사람 ${pct}% (${stats.wins}/${stats.total_plays})`;
}

export function teamLeadLine(stats) {
  if (!stats) return '';
  const rows = [
    ['파랑', stats.team_blue_wins],
    ['빨강', stats.team_red_wins],
    ['노랑', stats.team_yellow_wins],
    ['초록', stats.team_green_wins],
  ];
  const sum = rows.reduce((a, [, n]) => a + Number(n || 0), 0);
  if (!sum) return '';
  rows.sort((a, b) => b[1] - a[1]);
  return `오늘 응원 선두: ${rows[0][0]}팀 (${rows[0][1]}승)`;
}

export function monthQuest(seasonStreaks) {
  const draws = seasonStreaks?.total_draws ?? 0;
  const goal = 3;
  return {
    title: '이번 달 과제: 무승부 3회',
    current: Math.min(draws, goal),
    goal,
    done: draws >= goal,
  };
}

export const BADGE_CATALOG = [
  { key: 'first_play',      name: '첫 판',     desc: '처음 손을 냈어요' },
  { key: 'first_win',       name: '첫 승',     desc: '처음으로 이겼어요' },
  { key: 'first_lose',      name: '첫 패',     desc: '아쉽지만 기록은 남아요' },
  { key: 'first_draw',      name: '첫 무',     desc: '팽팽한 첫 무승부' },
  { key: 'first_retry_win', name: '첫 역전',   desc: '광고 후 뒤집었어요' },
  { key: 'play_7',          name: '7일 출석',  desc: '일주일 동안 만났어요' },
  { key: 'play_10',         name: '10일 출석', desc: '명예의 전당 출석 문턱' },
  { key: 'win_3',           name: '3연승',     desc: '연속 승리 3' },
  { key: 'win_5',           name: '5연승',     desc: '연속 승리 5' },
  { key: 'retry_3',         name: '역전 3회',  desc: '광고 역전승 3회' },
  { key: 'month_draw_3',    name: '무의 달인', desc: '이번 달 무승부 3회' },
  { key: 'team_joined',     name: '응원 합류', desc: '응원 색을 골랐어요' },
  { key: 'week_theme_win',  name: '주간 손',   desc: '이번 주 테마 손으로 승리' },
  { key: 'scissors_3',      name: '가위 장인', desc: '가위로 3승' },
];

export function extraBadgeKeys({ records = [], weekHand } = {}) {
  const extra = [];
  const scissorWins = records.filter((r) => r.user_choice === 'scissors' && r.result === 'win').length;
  if (scissorWins >= 3) extra.push('scissors_3');
  if (weekHand && records.some((r) => r.user_choice === weekHand && r.result === 'win')) {
    extra.push('week_theme_win');
  }
  return extra;
}

export function buildShareText({ result, winStreak = 0, isRetry = false } = {}) {
  const kr = { win: '이겼어요', lose: '졌어요', draw: '비겼어요' }[result] ?? '한 판 끝냈어요';
  const bits = [`오늘 가위바위보에서 ${kr}!`];
  if (result === 'win' && winStreak > 1) bits.push(`지금 ${winStreak}연승 중`);
  if (isRetry && result === 'win') bits.push('광고 재도전으로 뒤집었어요');
  bits.push('하루 한 번 가위바위보');
  return bits.join(' ');
}

export const TEAM_COLORS = [
  { key: 'blue',   label: '파랑' },
  { key: 'red',    label: '빨강' },
  { key: 'yellow', label: '노랑' },
  { key: 'green',  label: '초록' },
];
