/**
 * 작은 기능 검사 — 브라우저 없이 규칙만 확인합니다.
 */
import assert from 'node:assert/strict';
import {
  validateNickname,
  currentSeason,
  todayHandHint,
  fortuneCopy,
  playStreakDday,
  streakWarning,
  summarizeHabits,
  summarizeWeek,
  worldWinLine,
  extraBadgeKeys,
  buildShareText,
} from '../src/lib/content.js';
import { judgeResult, buildStreakMessage } from '../src/lib/game.js';

assert.equal(validateNickname('용감한 치타').ok, true);
assert.equal(validateNickname('a').ok, false);
assert.equal(validateNickname('admin왕').ok, false);

assert.match(currentSeason(), /^\d{4}-\d{2}$/);
assert.match(todayHandHint('2026-08-20').text, /힌트/);
assert.match(fortuneCopy('win'), /운세/);

assert.match(playStreakDday(3), /7일/);
assert.match(playStreakDday(10), /명예의 전당/);
assert.match(streakWarning({ playStreak: 4, playedToday: false }), /출석이 끊겨요/);
assert.equal(streakWarning({ playStreak: 4, playedToday: true }), '');

const habits = summarizeHabits([
  { user_choice: 'scissors', result: 'win' },
  { user_choice: 'scissors', result: 'lose' },
  { user_choice: 'rock', result: 'win' },
]);
assert.equal(habits.favorite, 'scissors');
assert.equal(habits.percents.scissors, 67);

const week = summarizeWeek([
  { played_at: '2026-08-17', result: 'win' },
  { played_at: '2026-08-18', result: 'win' },
  { played_at: '2026-08-19', result: 'lose' },
]);
assert.equal(week.wins, 2);
assert.equal(week.maxWin, 2);

assert.match(worldWinLine({ total_plays: 10, wins: 4 }), /40%/);
assert.deepEqual(
  extraBadgeKeys({
    records: [
      { user_choice: 'scissors', result: 'win' },
      { user_choice: 'scissors', result: 'win' },
      { user_choice: 'scissors', result: 'win' },
    ],
    weekHand: 'rock',
  }),
  ['scissors_3']
);

assert.equal(judgeResult('rock', 'scissors'), 'win');
assert.equal(judgeResult('rock', 'paper'), 'lose');
assert.match(buildStreakMessage('win', true, {
  win_streak: 2, total_wins: 3, retry_wins: 1, play_streak: 10,
}), /역전승/);
assert.match(buildShareText({ result: 'win', winStreak: 3 }), /3연승/);

console.log('기능 검사 통과');
