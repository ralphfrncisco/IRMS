import { useEffect } from 'react';

export default function KulasWidget() {
  useEffect(() => {
    // Inject marked.js first if not already loaded
    if (!window.marked) {
      const marked = document.createElement('script');
      marked.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js';
      document.head.appendChild(marked);
    }

    // Inject widget script
    const script = document.createElement('script');
    script.src = 'https://kulas-api.vercel.app/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup on logout
      document.body.removeChild(script);
      document.getElementById('kulas-bubble')?.remove();
      document.getElementById('kulas-window')?.remove();
    };
  }, []);

  return null;
}