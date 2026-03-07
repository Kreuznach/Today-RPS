/** components/Toast.jsx */
import React from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function Toast() {
  const { toast } = useApp();
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`toast${toast.visible ? ' show' : ''}`}
    >
      {toast.msg}
    </div>
  );
}
