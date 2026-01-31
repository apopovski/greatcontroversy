import React from 'react';
import './Splash.css';
import { trackEvent } from '../utils/analytics';

type Props = {
  onStart: () => void;
  onChooseLanguage?: () => void;
  onClose?: () => void;
};

export default function Splash({ onStart, onChooseLanguage, onClose }: Props) {
  // (Enter button removed — use Read as primary CTA)

  const handleRead = React.useCallback(() => {
    try { trackEvent('splash_read'); } catch {}
    // If a dedicated read action is provided in future, call it. For now reuse onStart.
    onStart();
  }, [onStart]);

  // Keyboard handler: trigger read action when Enter is pressed
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase?.() || '';
      const isInput = tag === 'input' || tag === 'textarea' || (target && (target as HTMLInputElement).isContentEditable);
      if (isInput) return;
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      e.preventDefault();
      handleRead();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleRead]);

  return (
    <section className="splash-typographic">
      <div className="splash-bg" aria-hidden />

      <div className="splash-graphic" aria-hidden>
        {/* clicking the artwork should go to the home page */}
        <a href="/" className="splash-art-link" aria-label="Home">
          <picture>
            {/* mobile first source */}
            <source media="(max-width: 820px)" srcSet="/public/graphics/The-Great-Controversy-Mobile-Spash.svg" type="image/svg+xml" />
            {/* desktop fallback (use svg version in public/graphics) */}
            <img className="splash-art" src="/public/graphics/The-Great-Controversy-Spash.svg" alt="The Great Controversy" />
          </picture>
        </a>
      </div>

      <div className="splash-content">
        <p className="splash-hero-text">
          <a href="/" className="splash-title-link">The Great Controversy</a> traces the unseen conflict between good and evil from the dawn of time to the end. It reveals the hidden forces shaping history, faith, and the destiny of humanity!
        </p>

        <div className="splash-cta">
          <button className="splash-read" onClick={handleRead} aria-label="Read">
            Read
          </button>
        </div>
      </div>
    </section>
  );
}
