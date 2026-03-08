/**
 * lib/supabase.js
 * Supabase 클라이언트 & 데이터 액세스 레이어
 */

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, generateNickname } from './config.js';

let _client = null;
export function getClient() {
  if (!_client) _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return _client;
}

// ─────────────────────────────────────────
// 날짜 (서버 KST 기준)
// ─────────────────────────────────────────
export function getLocalKSTDate() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  return now.toISOString().split('T')[0]; // 'YYYY-MM-DD'
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
}

// ─────────────────────────────────────────
// 명예의 전당
// ─────────────────────────────────────────
export async function fetchHallOfFame(category) {
  const { data, error } = await getClient()
    .from('hall_of_fame')
    .select('rank, user_id, record, achieved_at, users(nickname)')
    .eq('category', category)
    .order('rank', { ascending: true });
  if (error) throw error;
  return data ?? [];
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
