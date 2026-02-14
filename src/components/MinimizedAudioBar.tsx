import React from 'react';
import './AudioPlayer.css';

type Props = {
  playing: boolean;
  time: number;
  duration: number;
  onToggle: () => void;
  onExpand: () => void;
  chapterTitle: string;
};

function fmtTime(s: number) {
  if (!isFinite(s) || s <= 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export default function MinimizedAudioBar({ playing, time, duration, onToggle, onExpand, chapterTitle }: Props) {
  return (
    <div className="audio-minibar" onClick={onExpand}>
      <div className="audio-minibar-title">{chapterTitle}</div>
      <div className="audio-minibar-controls" onClick={e => e.stopPropagation()}>
        <button onClick={onToggle} aria-label="Play/Pause">{playing ? 'Pause' : 'Play'}</button>
        <span className="audio-minibar-time">{fmtTime(time)} / {fmtTime(duration)}</span>
      </div>
    </div>
  );
}
