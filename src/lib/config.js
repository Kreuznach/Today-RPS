/**
 * lib/config.js
 * Supabase 연결 정보 및 Toss 유저 식별자
 */
import { GoogleAdMob, User, Screen } from '@apps-in-toss/web-framework';

/** 재도전 광고 그룹 ID (AIT 대시보드에서 발급) */
const AD_GROUP_ID_PROD = 'ait.v2.live.cacf10246e29481d';

/**
 * Toss Ads 공식 테스트 전용 광고 ID (리워드 광고)
 * 참고: https://developers-apps-in-toss.toss.im/ads/develop.html#테스트하기
 * 실제 광고 ID로 테스트하면 정책 위반으로 간주되어 불이익을 받을 수 있습니다.
 */
const AD_GROUP_ID_TEST = 'ait-ad-test-rewarded-id';

/**
 * 테스트 광고 여부 결정
 *  - VITE_AD_ENV=test        → 테스트 ID 강제 사용
 *  - VITE_AD_ENV=production  → 프로덕션 ID 강제 사용
 *  - 미설정                  → 개발 빌드(import.meta.env.DEV)이면 테스트 ID, 아니면 프로덕션 ID
 */
const _useTestAd = (() => {
  const adEnv = import.meta.env.VITE_AD_ENV;
  if (adEnv === 'test')       return true;
  if (adEnv === 'production') return false;
  return import.meta.env.DEV;
})();

const AD_GROUP_ID = _useTestAd ? AD_GROUP_ID_TEST : AD_GROUP_ID_PROD;

/**
 * 미니앱 종료 — AIT의 Screen.close() 를 호출합니다.
 * AIT 미지원 환경(개발/브라우저)에서는 아무 동작도 하지 않습니다.
 */
export function closeApp() {
  Screen.close().catch(() => {});
}

export const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL     ?? '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

/**
 * Toss 유저 식별자 반환
 *
 * AIT(Apps In Toss) 환경에서는 `User.getAnonymousKey()`가 반환하는 HASH 값을
 * 사용자 식별자로 사용합니다. 이 값은 동일 Toss 계정에서 항상 동일하게
 * 반환되므로 안정적인 고유 ID로 활용할 수 있습니다.
 * AIT 미지원 환경(개발/브라우저)에서는 localStorage 기반 게스트 ID로 폴백합니다.
 */
export async function getTossUserId() {
  try {
    const result = await User.getAnonymousKey();
    if (result && result.type === 'HASH') {
      return result.hash;
    }
  } catch {
    // AIT SDK 미지원 환경 (개발/브라우저) 또는 오류
  }
  return _guestId();
}

/**
 * 닉네임 생성
 *
 * Toss SDK는 닉네임을 직접 제공하지 않으므로 앱에서 자동 생성합니다.
 * 신규 사용자 최초 등록 시에만 호출되며, 결과는 DB에 저장됩니다.
 * 로컬 캐시 없이 항상 새로운 닉네임을 생성하여 사용자별 고유성을 보장합니다.
 * 형식 예시: '용감한 치타#4829'
 */
export function generateNickname() {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = String(Math.floor(Math.random() * 9000) + 1000);
  return `${adj} ${noun}#${num}`;
}

const ADJECTIVES = [
  '용감한', '느린', '귀여운', '무서운', '진지한', '도전하는', '빠른', '신나는',
  '열정적인', '날카로운', '침착한', '거침없는', '번개같은', '불굴의', '강력한', '재빠른',
];
const NOUNS = [
  '치타', '맹구', '가위', '독수리', '용', '호랑이', '사자', '곰',
  '판다', '여우', '늑대', '매', '표범', '상어', '고릴라', '독사',
];

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
  { key: 'play_streak', label: '📅 연속 출석', minLabel: '10일 이상' },
  { key: 'total_wins',  label: '🏆 총 승리' },
  { key: 'retry_wins',  label: '🎲 역전승' },
];
