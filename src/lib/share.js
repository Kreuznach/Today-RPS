/**
 * lib/share.js
 * 결과 공유 — 익명 ID는 넣지 않습니다.
 */

export async function shareText(text) {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: '하루 한 번 가위바위보', text });
      return 'shared';
    } catch (e) {
      if (e?.name === 'AbortError') return 'cancel';
    }
  }
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
  return 'unsupported';
}

const HAND = { rock: '바위', scissors: '가위', paper: '보' };
const RES  = { win: '승리', lose: '패배', draw: '무승부' };

/** 화면 캡처용 작은 카드. 친구에게 보낼 그림입니다. */
export async function shareResultCard({ result, userChoice, compChoice, winStreak = 0 }) {
  const text = [
    `오늘 ${RES[result] ?? '한 판'}!`,
    `나 ${HAND[userChoice] ?? '?'} vs 컴퓨터 ${HAND[compChoice] ?? '?'}`,
    winStreak > 1 ? `${winStreak}연승` : '',
    '하루 한 번 가위바위보',
  ].filter(Boolean).join('\n');

  if (typeof document === 'undefined') return shareText(text);

  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0064FF';
  ctx.fillRect(0, 0, 720, 420);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 36px sans-serif';
  ctx.fillText('하루 한 번 가위바위보', 40, 80);
  ctx.font = '800 64px sans-serif';
  ctx.fillText(RES[result] ?? '결과', 40, 180);
  ctx.font = '600 28px sans-serif';
  ctx.fillText(`나 ${HAND[userChoice] ?? '?'}  vs  컴퓨터 ${HAND[compChoice] ?? '?'}`, 40, 250);
  if (winStreak > 1) ctx.fillText(`${winStreak}연승`, 40, 300);
  ctx.font = '500 20px sans-serif';
  ctx.fillText('익명으로 보내는 오늘의 한 줄', 40, 370);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (blob && navigator.share && navigator.canShare) {
    const file = new File([blob], 'today-rps.png', { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: '하루 한 번 가위바위보', text, files: [file] });
        return 'shared';
      } catch (e) {
        if (e?.name === 'AbortError') return 'cancel';
      }
    }
  }
  return shareText(text);
}
