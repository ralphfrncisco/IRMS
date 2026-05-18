import { useEffect } from 'react';

export default function KulasWidget() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://kulas-api.vercel.app/widget.js';
    script.async = true;
    document.body.appendChild(script);

    const observer = new MutationObserver(() => {
      const bubble = document.getElementById('kulas-bubble');
      const win = document.getElementById('kulas-window');
      if (!bubble) return;

      const modalOpen = document.querySelector('.fixed.inset-0.bg-black\\/60, [role="dialog"]');
      bubble.style.display = modalOpen ? 'none' : '';
      if (win) win.style.display = modalOpen ? 'none' : '';
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      document.body.removeChild(script);
      document.getElementById('kulas-bubble')?.remove();
      document.getElementById('kulas-window')?.remove();
    };
  }, []);

  return null;
}