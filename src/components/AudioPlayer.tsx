import React, { useEffect, useRef, useState } from 'react';
import MinimizedAudioBar from './MinimizedAudioBar';
import './AudioPlayer.css';
import { LANGUAGE_NAMES } from '../utils/language';

type Props = {
  lang: string;
  chapterIdx: number;
  chapterTitle?: string;
  onNextChapter?: () => void;
  onPrevChapter?: () => void;
  minimized?: boolean;
  onExpand?: () => void;
};

function fmtTime(s: number) {
  if (!isFinite(s) || s <= 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function AudioPlayer({ lang, chapterIdx, chapterTitle, onNextChapter, onPrevChapter, minimized, onExpand }: Props) {
  console.log('[AudioPlayer] Render', { lang, chapterIdx, minimized });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [time, setTime] = useState(0);
  const [speed, setSpeed] = useState<number>(() => Number(localStorage.getItem('audio-speed') || '1'));
  const [volume, setVolume] = useState<number>(() => Number(localStorage.getItem('audio-volume') || '1'));
  const [audioLang, setAudioLang] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(true);

  // Load index.json to find available files for the selected language
  useEffect(() => {
    let mounted = true;
    console.log('[AudioPlayer] useEffect[lang, chapterIdx] triggered', { lang, chapterIdx });

    const fetchIndex = async (languageName: string) => {
      const base = `/book-content/audio/${encodeURIComponent(languageName)}`;
      console.log(`[AudioPlayer] Fetching index: ${base}/index.json`);
      try {
        const r = await fetch(`${base}/index.json`);
        if (!r.ok) {
          console.warn(`[AudioPlayer] Fetch failed for ${languageName}: ${r.status}`);
          return null;
        }
        const list = await r.json() as string[];
        console.log(`[AudioPlayer] Fetch success for ${languageName}`, { count: list.length });
        return { list, base };
      } catch (err) {
        console.error(`[AudioPlayer] Fetch error for ${languageName}`, err);
        return null;
      }
    };

    const load = async () => {
      console.log('[AudioPlayer] load() started');
      setLoadingAudio(true);
      setSrc(null);
      setAudioLang(null);

      // Try to get the language name from LANGUAGE_NAMES mapping
      const mappedLang = LANGUAGE_NAMES[lang];
      console.log('[AudioPlayer] Mapped language:', { input: lang, mapped: mappedLang });
      
      // Use mapped name if available, otherwise use input directly
      const preferredLang = mappedLang || lang;
      console.log('[AudioPlayer] Preferred language:', preferredLang);
      
      let result = await fetchIndex(preferredLang);
      let usedLang = preferredLang;

      // If not found and not English, try English
      if (!result && preferredLang.toLowerCase() !== 'english') {
        console.log('[AudioPlayer] No audio for preferred lang, falling back to English');
        result = await fetchIndex('English');
        if (result) {
          usedLang = 'English';
          console.log('[AudioPlayer] Fallback to English successful');
        } else {
          console.log('[AudioPlayer] Fallback to English also failed');
        }
      }

      if (!mounted) {
        console.log('[AudioPlayer] Component unmounted during load');
        return;
      }

      if (result) {
        const pad = String(chapterIdx + 1).padStart(2, '0');
        const match = result.list.find((f) => f.startsWith(`GC-${pad}-`) || f.startsWith(`GC-${pad}`));
        console.log(`[AudioPlayer] Searching for chapter ${pad}`, { pattern: `GC-${pad}`, found: !!match, match });
        setAudioLang(usedLang);
        const newSrc = match ? `${result.base}/${encodeURIComponent(match)}` : null;
        console.log('[AudioPlayer] Setting new src:', newSrc);
        setSrc(newSrc);
      } else {
        console.log('[AudioPlayer] No result from fetch, audio unavailable');
        setAudioLang(null);
        setSrc(null);
      }

      console.log('[AudioPlayer] load() finished');
      setLoadingAudio(false);
    };

    load();
    return () => { 
      mounted = false; 
      console.log('[AudioPlayer] useEffect[lang, chapterIdx] cleanup');
    };
  }, [lang, chapterIdx]);

  // persist speed and volume
  useEffect(() => {
    console.log('[AudioPlayer] Setting speed:', speed);
    try { localStorage.setItem('audio-speed', String(speed)); } catch {}
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => { 
    console.log('[AudioPlayer] Setting volume:', volume);
    try { localStorage.setItem('audio-volume', String(volume)); } catch {} 
    if (audioRef.current) audioRef.current.volume = volume; 
  }, [volume]);

  // attach events
  useEffect(() => {
    const a = audioRef.current;
    console.log('[AudioPlayer] useEffect[src] triggered. Attaching events to audio element.', { src, element: a });
    if (!a) return;
    const onPlay = () => { console.log('[AudioPlayer] Event: play'); setPlaying(true); };
    const onPause = () => { console.log('[AudioPlayer] Event: pause'); setPlaying(false); };
    const onTime = () => setTime(a.currentTime || 0);
    const onMeta = () => { console.log('[AudioPlayer] Event: loadedmetadata', { duration: a.duration }); setDuration(a.duration || 0); };
    const onEnd = () => {
      console.log('[AudioPlayer] Event: ended');
      setPlaying(false);
      // Auto-play next chapter if available
      if (onNextChapter) onNextChapter();
    };
    const onError = (e: ErrorEvent) => { console.error('[AudioPlayer] Event: error', e); };

    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    a.addEventListener('error', onError);
    return () => {
      console.log('[AudioPlayer] useEffect[src] cleanup. Removing events.');
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('error', onError);
    };
  }, [src, onNextChapter]);

  // resume saved position per lang+chapter
  useEffect(() => {
    if (!src) return;
    const languageName = LANGUAGE_NAMES[lang] || lang;
    const key = `audio-pos:${languageName}:${chapterIdx}`;
    const a = audioRef.current;
    console.log(`[AudioPlayer] Attempting to restore position for key: ${key}`);
    const tryRestore = () => {
      try {
        const v = Number(localStorage.getItem(key) || '0');
        if (a && isFinite(v) && v > 2 && v < (a.duration || Infinity)) {
          console.log(`[AudioPlayer] Restoring position to ${v}s`);
          a.currentTime = v;
        } else {
          console.log(`[AudioPlayer] Not restoring position.`, { storedValue: v, duration: a?.duration });
        }
      } catch(e) {
        console.error('[AudioPlayer] Error restoring position', e);
      }
    };
    // wait for metadata
    const onMeta = () => {
      console.log('[AudioPlayer] loadedmetadata for restore');
      tryRestore();
    }
    a?.addEventListener('loadedmetadata', onMeta);
    tryRestore(); // Also try immediately in case metadata is already loaded
    return () => { a?.removeEventListener('loadedmetadata', onMeta); };
  }, [src, lang, chapterIdx]);

  // save position periodically
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !src) return;
    let t: number | null = null;
    const save = () => {
      if (a.currentTime > 0 && a.duration > 0) {
        const languageName = LANGUAGE_NAMES[lang] || lang;
        const key = `audio-pos:${languageName}:${chapterIdx}`;
        try { 
          localStorage.setItem(key, String(a.currentTime || 0)); 
          // console.log(`[AudioPlayer] Position saved for ${key}: ${a.currentTime}`);
        } catch {}
      }
    };
    t = window.setInterval(save, 3000);
    return () => { if (t) window.clearInterval(t); };
  }, [src, lang, chapterIdx]);
  
  // toggle play/pause
  const toggle = async () => {
    const a = audioRef.current;
    console.log('[AudioPlayer] toggle() called.', { paused: a?.paused, src: a?.src });
    if (!a) return;
    try {
      if (a.paused) {
        await a.play();
      } else {
        a.pause();
      }
    } catch (err) {
      console.error('[AudioPlayer] Error in toggle play/pause:', err);
    }
  };

  const seekTo = (p: number) => {
    const a = audioRef.current; 
    console.log(`[AudioPlayer] seekTo() called: ${p}s`);
    if (!a) return; 
    a.currentTime = p;
  };

  const displayAudioLang = audioLang || (LANGUAGE_NAMES[lang] || lang);

  if (loadingAudio) {
    console.log('[AudioPlayer] Rendering: Loading state');
    return (
      <div className="audio-player modern-audio-player audio-unavailable">
        <div className="audio-unavailable-text">Loading audio…</div>
      </div>
    );
  }

  if (!src) {
    console.log('[AudioPlayer] Rendering: Not available state');
    return (
      <div className="audio-player modern-audio-player audio-unavailable">
        <div className="audio-unavailable-text">
          {audioLang ? 'Audio is not available for this chapter.' : 'Audio is not available for this language yet.'}
        </div>
      </div>
    );
  }

  if (minimized) {
    console.log('[AudioPlayer] Rendering: Minimized bar');
    return (
      <MinimizedAudioBar
        playing={playing}
        time={time}
        duration={duration}
        onToggle={toggle}
        onExpand={onExpand || (() => {})}
        chapterTitle={chapterTitle || ''}
      />
    );
  }
  
  console.log('[AudioPlayer] Rendering: Full player UI');
  return (
    <div className="audio-player modern-audio-player">
      <audio ref={audioRef} src={src} preload="metadata" crossOrigin="anonymous" />
      <div className="audio-info">
        <div className="audio-chapter">
          <span className="audio-chapter-title">{chapterTitle || 'Untitled Chapter'}</span>
          <span className="audio-chapter-lang">{displayAudioLang}</span>
        </div>
        <div className="audio-times">{fmtTime(time)} / {fmtTime(duration)}</div>
      </div>
      <div className="audio-controls">
        <button className="audio-btn audio-rewind" onClick={() => seekTo(Math.max(0, (audioRef.current?.currentTime || 0) - 15))} aria-label="Rewind 15">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 19l-9-7 9-7v14zM22 19l-9-7 9-7v14z"/></svg>
        </button>
        <button className="audio-btn audio-play" onClick={toggle} aria-label="Play/Pause">
          {playing ? (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          )}
        </button>
        <button className="audio-btn audio-forward" onClick={() => seekTo(Math.min(audioRef.current?.duration || 0, (audioRef.current?.currentTime || 0) + 15))} aria-label="Forward 15">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5l9 7-9 7V5zM2 5l9 7-9 7V5z"/></svg>
        </button>
      </div>
      <div className="audio-timeline" onClick={(e) => {
        const el = e.currentTarget as HTMLElement; const rect = el.getBoundingClientRect(); const x = (e as React.MouseEvent).clientX - rect.left; const pct = x / rect.width; seekTo((audioRef.current?.duration || 0) * pct);
      }}>
        <div className="audio-progress" style={{ width: `${(duration ? (time / duration) : 0) * 100}%` }} />
      </div>
      <div className="audio-settings">
        <label className="audio-label">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <select value={String(speed)} onChange={(e) => setSpeed(Number(e.target.value))}>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
          </select>
        </label>
        <label className="audio-label">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          <input type="range" min={0} max={1} step={0.01} value={String(volume)} onChange={(e) => setVolume(Number(e.target.value))} />
        </label>
        {src && <a className="audio-download" href={src} download target="_blank" rel="noreferrer">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        </a>}
      </div>
    </div>
  );
}
