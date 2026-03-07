/**
 * lib/config.js
 * Supabase 연결 정보 및 Toss 유저 식별자
 */
import { GoogleAdMob } from '@apps-in-toss/web-framework';

/** 재도전 광고 그룹 ID (AIT 대시보드에서 발급) */
const AD_GROUP_ID = 'ait.v2.live.cacf10246e29481d';

export const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Toss 유저 식별자 반환
 *
 * Toss In-App SDK가 제공하는 익명 UUID (sub 클레임)을 사용합니다.
 * SDK를 통해 받은 JWT는 Supabase Custom JWT Provider에서
 * 검증되며, auth.jwt() ->> 'sub' 으로 RLS 에서 판단됩니다.
 */
export function getTossUserId() {
  // 실제 환경 (Toss In-App SDK)
  // const user = window.TossInApp?.getUser();
  // return user?.userId ?? _guestId();
  return _guestId();
}

/**
 * 닉네임 반환
 *
 * Toss SDK는 닉네임을 직접 제공하지 않습니다 (실명 금융앱 특성상).
 * 앙은 표시 이름은 앱에서 자동 생성하여 DB에 저장합니다.
 * 형식 예시: '용감한 치타#4829'
 */
export function getTossNickname() {
  const stored = localStorage.getItem('rps_nick');
  if (stored) return stored;
  const nick = _generateNickname();
  localStorage.setItem('rps_nick', nick);
  return nick;
}

const ADJECTIVES = [
  '용감한', '느린', '귀여운', '무서운', '진지한', '도전하는', '빠른', '신나는',
  '열정적인', '날카로운', '침착한', '거침없는', '번개같은', '불굴의', '강력한', '재빠른',
];
const NOUNS = [
  '치타', '맹구', '가위', '독수리', '용', '호랑이', '사자', '곰',
  '판다', '여우', '늑대', '매', '표범', '상어', '고릴라', '독사',
];

function _generateNickname() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = String(Math.floor(Math.random() * 9000) + 1000);
  return `${adj} ${noun}#${num}`;
}

function _guestId() {
  const KEY = 'rps_uid';
  let uid = localStorage.getItem(KEY);
  if (!uid) {
    uid = 'dev_' + Math.random().toString(36).slice(2, 11);
    localStorage.setItem(KEY, uid);
  }
  return uid;
}

/**
 * AIT 환경 여부 확인
 * `isSupported()`는 AIT 네이티브 맵에 해당 브릿지가 등록된 경우에만 true를 반환합니다.
 */
function _isAitSupported() {
  try {
    return GoogleAdMob.loadAppsInTossAdMob.isSupported() === true;
  } catch {
    return false;
  }
}

/**
 * 광고 시청 후 재도전 기회 획득
 *
 * AIT 환경: loadAppsInTossAdMob → showAppsInTossAdMob 두 단계로 동작합니다.
 *   - loaded 이벤트 수신 시 광고 준비 완료
 *   - userEarnedReward 이벤트 수신 시 보상 획득 확정
 *   - dismissed 이벤트 수신 시 최종 결과를 반환합니다 (보상 미획득이면 false)
 * 개발/데스크톱 환경: 1.5초 지연 후 true를 반환하는 Mock으로 폴백합니다.
 *
 * @returns {Promise<boolean>} 광고를 끝까지 시청해 보상을 받으면 true, 아니면 false
 */
export async function watchAd() {
  if (!_isAitSupported()) {
    // 개발 환경 Mock
    await new Promise(r => setTimeout(r, 1500));
    return true;
  }

  // 1단계: 광고 로드
  await new Promise((resolve, reject) => {
    const cleanup = GoogleAdMob.loadAppsInTossAdMob({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded') {
          cleanup();
          resolve();
        }
      },
      onError: (error) => {
        cleanup();
        reject(error);
      },
    });
  });

  // 2단계: 광고 표시 & 보상 확인
  return new Promise((resolve) => {
    let rewarded = false;
    GoogleAdMob.showAppsInTossAdMob({
      options: { adGroupId: AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'userEarnedReward') rewarded = true;
        if (event.type === 'dismissed')        resolve(rewarded);
        if (event.type === 'failedToShow')     resolve(false);
      },
      onError: () => resolve(false),
    });
  });
}

export const CHOICE_EMOJI = { rock: '✊', scissors: '✌️', paper: '🖐️' };
export const CHOICE_KR    = { rock: '바위', scissors: '가위', paper: '보' };
export const RESULT_MAP   = {
  win:  { emoji: '🎉', title: '승리!',  cls: 'win',  sub: '축하합니다! 오늘의 승자!' },
  lose: { emoji: '😢', title: '패배…',  cls: 'lose', sub: '아쉽지만 다음엔 이길 거예요!' },
  draw: { emoji: '🤝', title: '무승부', cls: 'draw', sub: '비슷비슷한 실력이네요~' },
};
export const HOF_UNITS = {
  win_streak: '연승', lose_streak: '연패', draw_streak: '연무',
  play_streak: '일', total_wins: '승', retry_wins: '회',
};
export const HOF_CATEGORIES = [
  { key: 'win_streak',  label: '🏅 연속 승리' },
  { key: 'lose_streak', label: '💀 연속 패배' },
  { key: 'draw_streak', label: '🤝 연속 무승부' },
  { key: 'play_streak', label: '📅 연속 출석' },
  { key: 'total_wins',  label: '🏆 총 승리' },
  { key: 'retry_wins',  label: '🎲 역전승' },
];
