/**
 * components/ErrorScreen.jsx
 * 첫 연결이 실패해도 오늘 기회는 서버에 그대로 있습니다.
 */
import React from 'react';

export default function ErrorScreen({ online, onRetry }) {
  return (
    <div className="view active error-screen">
      <main className="error-content">
        <p className="error-emoji" aria-hidden="true">📡</p>
        <h1 className="error-title">지금은 연결이 안 돼요</h1>
        <p className="error-sub">
          {online
            ? '서버에 잠깐 닿지 못했어요. 오늘 남은 기회는 사라지지 않아요.'
            : '인터넷이 끊긴 것 같아요. 오늘 남은 기회는 사라지지 않아요.'}
        </p>
        <button className="btn-primary" onClick={onRetry}>
          다시 시도
        </button>
      </main>
    </div>
  );
}
