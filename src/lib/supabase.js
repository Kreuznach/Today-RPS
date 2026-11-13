/**
 * lib/supabase.js
 * Supabase 클라이언트 & 데이터 액세스 레이어
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, generateNickname } from './config.js';
import { currentSeason, extraBadgeKeys, weekThemeHand } from './content.js';

let _client = null;
export function getClient() {
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

// ─────────────────────────────────────────
// 날짜 (서버 KST 기준)
// ─────────────────────────────────────────
export function getLocalKSTDate() {
  // en-CA 로케일은 YYYY-MM-DD 형식을 반환하며, timeZone 옵션으로 시스템 시간대와 무관하게 KST 날짜를 정확히 구한다.
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(new Date()); // 'YYYY-MM-DD'
}

// ─────────────────────────────────────────
// users
// ─────────────────────────────────────────
export async function getOrCreateUser(userId) {
  const db = getClient();
  // 기존 유저 조회 — 닉네임 덮어쓰기 방지
  const { data: existing } = await db
    .from('users')
    .select()
    .eq('user_id', userId)
    .maybeSingle();
  if (existing) return existing;

  // 최초 방문 시에만 닉네임 생성 & 삽입
  const { data, error } = await db
    .from('users')
    .insert({ user_id: userId, nickname: generateNickname() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─────────────────────────────────────────
// 오늘 플레이 상태
// ─────────────────────────────────────────
export async function getTodayStatus(userId) {
  const db    = getClient();
  const today = getLocalKSTDate();

  // has_used_retry 콼럼을 제거했으므로, game_records 에서
  // 당일 is_retry = true 레코드 존재 여부로 재도전 사용 여부를 판단합니다.
  const { data: records } = await db
    .from('game_records')
    .select('*')
    .eq('user_id', userId)
    .eq('played_at', today)
    .order('created_at', { ascending: false });

  const playedToday = !!records?.length;
  const firstRecord = records?.find(r => !r.is_retry) ?? null;
  const retryRecord = records?.find(r =>  r.is_retry) ?? null;

  return {
    playedToday,
    // game_records 기반 판단: 당일 is_retry=true 레코드가 있으면 이미 재도전 사용
    hasUsedRetry: !!retryRecord,
    firstRecord,
    retryRecord,
    latestRecord: retryRecord ?? firstRecord,
  };
}

// ─────────────────────────────────────────
// 게임 저장
// ─────────────────────────────────────────
export async function saveGameRecord(userId, userChoice, compChoice, result, isRetry = false) {
  if (!userId) throw Object.assign(new Error('USER_NOT_INITIALIZED'), { code: 'USER_NOT_INITIALIZED' });

  const db    = getClient();
  const today = getLocalKSTDate();

  const { error: recErr } = await db.from('game_records').insert({
    user_id: userId, played_at: today,
    user_choice: userChoice, comp_choice: compChoice,
    result, is_retry: isRetry,
  });
  if (recErr) throw recErr;

  // has_used_retry 콼럼 제거 후: last_played_at만 갱신
  const { error: uErr } = await db.from('users')
    .update({ last_played_at: today })
    .eq('user_id', userId);
  if (uErr) throw uErr;

  try {
    await awardLocalBadges(userId);
  } catch (_) { /* 배지 보강 실패는 판을 막지 않음 */ }
}

// ─────────────────────────────────────────
// 명예의 전당
// ─────────────────────────────────────────
export async function fetchHallOfFame(category, season = null) {
  const table = season ? 'hall_of_fame_season' : 'hall_of_fame';
  let q = getClient()
    .from(table)
    .select('rank, user_id, record, achieved_at, users(nickname)')
    .eq('category', category)
    .order('rank', { ascending: true });
  if (season) q = q.eq('season', season);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchMyRank(userId, category, season = null) {
  const { data, error } = await getClient()
    .rpc('fn_my_rank', {
      p_user_id: userId,
      p_category: category,
      p_season: season,
    });
  if (error) throw error;
  return data ?? { rank: null, record: 0, min_needed: 0 };
}

// ─────────────────────────────────────────
// 내 기록
// ─────────────────────────────────────────
export async function fetchMyStreaks(userId) {
  const { data, error } = await getClient()
    .from('streaks').select('*').eq('user_id', userId).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function fetchSeasonStreaks(userId, season = currentSeason()) {
  const { data, error } = await getClient()
    .from('season_streaks')
    .select('*')
    .eq('user_id', userId)
    .eq('season', season)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function fetchMyRecords(userId, sinceDate = null) {
  let q = getClient()
    .from('game_records')
    .select('user_choice, result, is_retry, played_at, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (sinceDate) q = q.gte('played_at', sinceDate);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function fetchDailyStats(dateStr) {
  const { data, error } = await getClient()
    .from('daily_stats')
    .select('*')
    .eq('stat_date', dateStr)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data ?? null;
}

export async function fetchMyBadges(userId) {
  const { data, error } = await getClient()
    .from('user_badges')
    .select('badge_key, earned_at')
    .eq('user_id', userId)
    .order('earned_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updateNickname(userId, nickname) {
  const { data, error } = await getClient()
    .from('users')
    .update({ nickname })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeamColor(userId, teamColor) {
  const { data, error } = await getClient()
    .from('users')
    .update({ team_color: teamColor })
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function awardBadges(userId, keys = []) {
  if (!keys.length) return;
  const rows = keys.map((badge_key) => ({ user_id: userId, badge_key }));
  const { error } = await getClient()
    .from('user_badges')
    .upsert(rows, { onConflict: 'user_id,badge_key', ignoreDuplicates: true });
  if (error) throw error;
}

async function awardLocalBadges(userId) {
  const [records, streaks] = await Promise.all([fetchMyRecords(userId), fetchMyStreaks(userId)]);
  const keys = extraBadgeKeys({ records, weekHand: weekThemeHand().hand, streaks });
  await awardBadges(userId, keys);
}
