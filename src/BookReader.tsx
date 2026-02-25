
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './BookReader.css';
import { MdMenu, MdTranslate, MdSearch, MdDarkMode, MdLightMode, MdContentCopy, MdShare, MdClose, MdMoreVert, MdBookmarkBorder, MdBookmark } from 'react-icons/md';
import { FaFacebookF, FaXTwitter, FaWhatsapp } from 'react-icons/fa6';
import { IoMdMail } from 'react-icons/io';
import { LANGUAGE_NAMES } from './utils/language';

type TocEntry = { title: string; href: string };

type BookContentProps = {
  loading: boolean;
  isDesktop: boolean;
  pageWidth: number;
  textSize: number;
  displayedHtml: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
  copyrightText: string;
  lang: string;
  chapterIdx: number;
};

const BookContent = React.memo(function BookContent({
  loading,
  isDesktop,
  pageWidth,
  textSize,
  displayedHtml,
  contentRef,
  copyrightText,
  lang,
  chapterIdx,
  chapterTitle,
  audioMinimized,
  setAudioMinimized,
  onNextChapter,
  onPrevChapter,
}: BookContentProps & {
  chapterTitle: string;
  audioMinimized: boolean;
  setAudioMinimized: (v: boolean) => void;
  onNextChapter: () => void;
  onPrevChapter: () => void;
}) {
  if (loading) {
    return (
      <main className="reader-main">
        <div>Loading…</div>
      </main>
    );
  }

  const wrapperStyle: React.CSSProperties = {
    width: isDesktop ? `${pageWidth}px` : '100%',
    fontSize: `${textSize}px`,
    position: 'relative',
  };

  return (
    <main className="reader-main">
      <div className="reader-wrapper" style={wrapperStyle}>
        <div className="reader-content-layout">
          <div className="reader-book-content">
            <div ref={contentRef} className="reader-book-html" dangerouslySetInnerHTML={{ __html: displayedHtml }} />
          </div>
        </div>
        <footer className="reader-footer">
          <div className="reader-footer-inner">
            {copyrightText}
          </div>
        </footer>
      </div>
    </main>
  );
}, (prev, next) => (
  prev.loading === next.loading &&
  prev.isDesktop === next.isDesktop &&
  prev.pageWidth === next.pageWidth &&
  prev.textSize === next.textSize &&
  prev.displayedHtml === next.displayedHtml &&
  prev.contentRef === next.contentRef &&
  prev.copyrightText === next.copyrightText &&
  prev.chapterTitle === next.chapterTitle &&
  prev.audioMinimized === next.audioMinimized
));

const AMHARIC_FOLDER = 'Amharic - Ellen G. White';
const AMHARIC_SOURCE_PATH = '/book-content/txt/Amharic.rtf';
const CHINESE_FOLDER = 'Chinese - Ellen G. White';
const CHINESE_SOURCE_PATH = '/book-content/txt/GC-Chinese.txt';
const SERBIAN_FOLDER = 'Serbian - Ellen G. White';
const SERBIAN_SOURCE_PATH = '/book-content/txt/GC-Serbian.txt';
const FARSI_FOLDER = 'Farsi - Ellen G. White';
const FARSI_SOURCE_PATH = '/book-content/txt/GC-Farsi.txt';

const DESKTOP_WIDTH_MIN = 640;
const DESKTOP_WIDTH_MAX = 820;
const DESKTOP_WIDTH_RECOMMENDED_MIN = 680;
const DESKTOP_WIDTH_RECOMMENDED_MAX = 760;

function getRecommendedDesktopWidth(viewportWidth: number) {
  const target = Math.round(viewportWidth * 0.67);
  return Math.max(
    DESKTOP_WIDTH_RECOMMENDED_MIN,
    Math.min(DESKTOP_WIDTH_RECOMMENDED_MAX, target)
  );
}

const LANGUAGE_FOLDERS = [
  'The Great Controversy - Ellen G. White 2',
  'El Conflicto de los Siglos - Ellen G. White',
  'Der grosse Kampf - Ellen G. White',
  'Il gran conflitto - Ellen G. White',
  'MOD EN BEDRE FREMTID - Ellen G. White',
  'Mot historiens klimaks - Ellen G. White',
  'O Grande Conflito - Ellen G. White',
  'O Le Finauga Tele - Ellen G. White',
  'Suur Voitlus - Ellen G. White',
  'Tragedia veacurilor - Ellen G. White',
  'VELIKA BORBA IZMEDU KRISTA I SOTONE - Ellen G. White',
  "VIeLIKATA BORBA MIeZhDU KhRISTA i SATANA - Ellen G. White",
  'Velke drama veku - Ellen G. White',
  'Velky spor vekov - Ellen G. White',
  "Vielika borot'ba - Ellen G. White",
  "Vielikaia bor'ba - Ellen G. White",
  'Wielki boj - Ellen G. White',
  "alSra` al`Zym - Ellen G. White",
  AMHARIC_FOLDER,
  CHINESE_FOLDER,
  SERBIAN_FOLDER,
  FARSI_FOLDER,
];

const LANGUAGE_ABBREV: Record<string, string> = {
  'The Great Controversy - Ellen G. White 2': 'en',
  'El Conflicto de los Siglos - Ellen G. White': 'es',
  'Der grosse Kampf - Ellen G. White': 'de',
  'Il gran conflitto - Ellen G. White': 'it',
  'MOD EN BEDRE FREMTID - Ellen G. White': 'da',
  'Mot historiens klimaks - Ellen G. White': 'no',
  'O Grande Conflito - Ellen G. White': 'pt',
  'O Le Finauga Tele - Ellen G. White': 'sm',
  'Suur Voitlus - Ellen G. White': 'et',
  'Tragedia veacurilor - Ellen G. White': 'ro',
  'VELIKA BORBA IZMEDU KRISTA I SOTONE - Ellen G. White': 'hr',
  "VIeLIKATA BORBA MIeZhDU KhRISTA i SATANA - Ellen G. White": 'bg',
  'Velke drama veku - Ellen G. White': 'sk',
  'Velky spor vekov - Ellen G. White': 'cs',
  "Vielika borot'ba - Ellen G. White": 'uk',
  "Vielikaia bor'ba - Ellen G. White": 'ru',
  'Wielki boj - Ellen G. White': 'pl',
  "alSra` al`Zym - Ellen G. White": 'ar',
  [AMHARIC_FOLDER]: 'am',
  [CHINESE_FOLDER]: 'zh',
  [SERBIAN_FOLDER]: 'sr',
  [FARSI_FOLDER]: 'fa',
};

const BOOK_TITLE_OVERRIDES: Record<string, string> = {
  [CHINESE_FOLDER]: '善恶之争',
  [SERBIAN_FOLDER]: 'Велика Борба Између Христа И Сотоне',
  [FARSI_FOLDER]: 'نبرد عظیم',
};

const getBookTitleFromFolder = (folder: string) =>
  BOOK_TITLE_OVERRIDES[folder] || (folder || '').split(' - Ellen')[0].trim();

const LANGUAGE_URL_NAMES: Record<string, string> = {
  'The Great Controversy - Ellen G. White 2': 'English',
  'El Conflicto de los Siglos - Ellen G. White': 'Español',
  'Der grosse Kampf - Ellen G. White': 'Deutsch',
  'Il gran conflitto - Ellen G. White': 'Italiano',
  'MOD EN BEDRE FREMTID - Ellen G. White': 'Dansk',
  'Mot historiens klimaks - Ellen G. White': 'Norsk',
  'O Grande Conflito - Ellen G. White': 'Português',
  'O Le Finauga Tele - Ellen G. White': 'Gagana Samoa',
  'Suur Voitlus - Ellen G. White': 'Eesti',
  'Tragedia veacurilor - Ellen G. White': 'Română',
  'VELIKA BORBA IZMEDU KRISTA I SOTONE - Ellen G. White': 'Hrvatski',
  "VIeLIKATA BORBA MIeZhDU KhRISTA i SATANA - Ellen G. White": 'Български',
  'Velke drama veku - Ellen G. White': 'Slovenčina',
  'Velky spor vekov - Ellen G. White': 'Čeština',
  "Vielika borot'ba - Ellen G. White": 'Українська',
  "Vielikaia bor'ba - Ellen G. White": 'Русский',
  'Wielki boj - Ellen G. White': 'Polski',
  "alSra` al`Zym - Ellen G. White": 'العربية',
  [AMHARIC_FOLDER]: 'አማርኛ',
  [CHINESE_FOLDER]: '中文',
  [SERBIAN_FOLDER]: 'Српски',
  [FARSI_FOLDER]: 'فارسی',
};

const LANGUAGE_CHAPTER_LABELS: Record<string, string> = {
  'The Great Controversy - Ellen G. White 2': 'Chapter',
  'El Conflicto de los Siglos - Ellen G. White': 'Capítulo',
  'Der grosse Kampf - Ellen G. White': 'Kapitel',
  'Il gran conflitto - Ellen G. White': 'Capitolo',
  'MOD EN BEDRE FREMTID - Ellen G. White': 'Kapitel',
  'Mot historiens klimaks - Ellen G. White': 'Kapittel',
  'O Grande Conflito - Ellen G. White': 'Capítulo',
  'O Le Finauga Tele - Ellen G. White': 'Mataupu',
  'Suur Voitlus - Ellen G. White': 'Peatükk',
  'Tragedia veacurilor - Ellen G. White': 'Capitol',
  'VELIKA BORBA IZMEDU KRISTA I SOTONE - Ellen G. White': 'Poglavlje',
  "VIeLIKATA BORBA MIeZhDU KhRISTA i SATANA - Ellen G. White": 'Glava',
  'Velke drama veku - Ellen G. White': 'Kapitola',
  'Velky spor vekov - Ellen G. White': 'Kapitola',
  "Vielika borot'ba - Ellen G. White": 'Rozdil',
  "Vielikaia bor'ba - Ellen G. White": 'Glava',
  'Wielki boj - Ellen G. White': 'Rozdział',
  "alSra` al`Zym - Ellen G. White": 'الفصل',
  [AMHARIC_FOLDER]: 'ምዕራፍ',
  [CHINESE_FOLDER]: '章',
  [SERBIAN_FOLDER]: 'Поглавље',
  [FARSI_FOLDER]: 'فصل',
};

const COPYRIGHTS: Record<string, string> = {
  // Use the localized book title (derived from the language folder) as the copyright holder.
  ...Object.fromEntries(LANGUAGE_FOLDERS.map(f => [f, `© 2026 ${getBookTitleFromFolder(f)}`]))
};

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

function slugify(input: string) {
  return (input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function slugifyAscii(input: string) {
  return (input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getChapterNumber(title: string) {
  const t = (title || '').trim();
  const m = t.match(/\bchapter\s+(\d+)\b/i);
  if (m && m[1]) return Number(m[1]);
  return null;
}

function stripChapterPrefix(title: string) {
  return (title || '')
    .replace(/^\s*chapter\s+\d+\s*[-—–:]*\s*/i, '')
    .trim();
}

const LANG_SLUG_TO_FOLDER: Record<string, string> = Object.fromEntries(
  LANGUAGE_FOLDERS.flatMap((folder) => {
    const localized = LANGUAGE_URL_NAMES[folder] || LANGUAGE_NAMES[folder] || getBookTitleFromFolder(folder) || folder;
    const nameSlug = slugifyAscii(localized);
    const abbrSlug = (LANGUAGE_ABBREV[folder] || '').toLowerCase();
    return [
      nameSlug ? [nameSlug, folder] : null,
      abbrSlug ? [abbrSlug, folder] : null,
    ].filter(Boolean) as Array<[string, string]>;
  })
);

function getHighlightedHtml(html: string, q: string | null) {
  if (!q) return html || '';
  try {
    const esc = escapeRegExp(q);
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    // Remove any <style> and external stylesheet links from the fragment to avoid
    // ebook styles leaking into the app UI when we inject the HTML.
    doc.querySelectorAll('style, link[rel="stylesheet"]').forEach(n => n.remove());
    // Also strip inline styles, classes and event handlers from all nodes so
    // the ebook's CSS/JS can't change layout or selection behaviour.
    doc.querySelectorAll('*').forEach((el) => {
      if ((el as Element).hasAttribute('style')) (el as Element).removeAttribute('style');
      if ((el as Element).hasAttribute('class')) (el as Element).removeAttribute('class');
      // remove inline event handlers
      Array.from((el as Element).attributes).forEach((a) => {
        if (a.name.startsWith('on')) (el as Element).removeAttribute(a.name);
      });
    });
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null as any);
    let n = walker.nextNode();
    while (n) {
      const t = n as Text;
      const text = t.nodeValue || '';
      const frag = doc.createDocumentFragment();
      let last = 0;
      const r = new RegExp(esc, 'gi');
      let m: RegExpExecArray | null;
      while ((m = r.exec(text)) !== null) {
        if (m.index > last) frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
        const mark = doc.createElement('mark');
        mark.className = 'search-highlight';
        mark.textContent = m[0];
        frag.appendChild(mark);
        last = m.index + m[0].length;
        if (r.lastIndex === m.index) r.lastIndex++;
      }
      if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
      if (frag.childNodes.length) t.parentNode?.replaceChild(frag, t);
      n = walker.nextNode();
    }
    return doc.body.innerHTML;
  } catch {
    return html || '';
  }
}

function addParagraphIds(html: string, chapterNumber: number) {
  try {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const paragraphs = doc.querySelectorAll('p, blockquote');
    paragraphs.forEach((el, idx) => {
      if (!el.id) {
        el.id = `gc-p-${chapterNumber}-${idx + 1}`;
      }
    });
    return doc.body.innerHTML;
  } catch {
    return html || '';
  }
}

function applyDropcap(html: string, langKey: string, chapterIndex: number, toc: TocEntry[]) {
  try {
    const name = LANGUAGE_NAMES[langKey] || '';
    // Do not apply dropcap for Arabic/Chinese languages
    // (RTL and CJK layouts often need custom typography handling)
    if (name.toLowerCase() === 'arabic' || name.toLowerCase() === 'farsi' || name.toLowerCase() === 'persian' || langKey === CHINESE_FOLDER || langKey === FARSI_FOLDER) return html;
    if (typeof chapterIndex !== 'number' || chapterIndex < 0) return html;
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    // Strip any styles or stylesheet links from the parsed chapter to avoid
    // overriding the main app styles when we insert the processed HTML.
    doc.querySelectorAll('style, link[rel="stylesheet"]').forEach(n => n.remove());
    // Also sanitize inline styles/classes/event handlers so the imported HTML
    // cannot prevent selection or shift layout.
    // Remove inline styles and event handlers, but preserve our markup classes
    // that are used for highlighting (`search-highlight`) and the dropcap.
    doc.querySelectorAll('*').forEach((el) => {
      if ((el as Element).hasAttribute('style')) (el as Element).removeAttribute('style');
      if ((el as Element).hasAttribute('class')) {
        const cls = ((el as Element).getAttribute('class') || '').split(/\s+/);
        const isHighlight = el.tagName === 'MARK' && cls.includes('search-highlight');
        const isDropcap = el.tagName === 'SPAN' && cls.includes('dropcap');
        if (!isHighlight && !isDropcap) (el as Element).removeAttribute('class');
      }
      Array.from((el as Element).attributes).forEach((a) => {
        if (a.name.startsWith('on')) (el as Element).removeAttribute(a.name);
      });
    });
    // Prefer the first paragraph (or blockquote) after the chapter heading
    let p: Element | null = null;
    const heading = doc.body.querySelector('h1,h2,h3,h4,h5,h6');
    // If the chapter heading indicates meta sections like "Information about this Book",
    // "Introduction", "Preface/Foreword", or "Appendix", do not apply the visual dropcap.
    if (heading) {
      const ht = (heading.textContent || '').trim();
      if (/information\s+about.*book/i.test(ht) || /^\s*introduction\b/i.test(ht) || /\b(preface|foreword|appendix)\b/i.test(ht)) return html;
    }
    // Also check the TOC entry (if provided) for Preface/Introduction/Appendix and skip
    if (Array.isArray(toc) && toc[chapterIndex] && /^(?:\s*(?:preface|introduction|foreword|appendix)\b)/i.test((toc[chapterIndex].title || '').trim())) {
      return html;
    }
    if (heading) {
      // If transformChapterHeading wrapped the heading, prefer the wrapper's
      // next sibling; otherwise start from heading.nextElementSibling. Skip
      // any interim .chapter-heading wrappers so we land on the real content.
      let sib: Element | null = null;
      if (heading.parentElement && (heading.parentElement as Element).classList.contains('chapter-heading')) {
        sib = heading.parentElement.nextElementSibling as Element | null;
      } else {
        sib = heading.nextElementSibling as Element | null;
      }
      while (sib) {
        if ((sib as Element).classList && (sib as Element).classList.contains('chapter-heading')) {
          sib = sib.nextElementSibling as Element | null;
          continue;
        }
        if (/^P$/i.test(sib.tagName) || /^BLOCKQUOTE$/i.test(sib.tagName) || (sib.tagName === 'DIV' && sib.textContent && sib.textContent.trim().length)) {
          p = sib;
          break;
        }
        sib = sib.nextElementSibling as Element | null;
      }
    }
    // fallback: prefer a real paragraph or blockquote; only if none exist
    // pick a div that isn't the chapter-heading wrapper.
    if (!p) p = doc.body.querySelector('p, blockquote');
    if (!p) p = doc.body.querySelector('div:not(.chapter-heading)');
    if (!p) return html;
    const walker = doc.createTreeWalker(p, NodeFilter.SHOW_TEXT, null as any);
    let tn = walker.nextNode();
    while (tn) {
      const txt = tn.nodeValue || '';
      const trimmed = txt.replace(/^\s+/, '');
      if (trimmed.length) {
        // Preserve an initial opening quote as part of the dropcap if present
        const quoteChars = ['"', '“', '”', '«', '»', '\u2018', '\u2019', '\u201E'];
        let take = 1;
        if (quoteChars.includes(trimmed[0]) && trimmed.length >= 2) take = 2;
        const leading = txt.match(/^\s*/)?.[0] || '';
        const drop = txt.substr(leading.length, take);
        const rest = txt.substr(leading.length + take);
        const frag = doc.createDocumentFragment();
        const span = doc.createElement('span');
        // Insert a stylized dropcap span (CSS will render it to span up to ~3 lines)
        span.className = 'dropcap';
        span.textContent = drop;
        frag.appendChild(doc.createTextNode(leading));
        frag.appendChild(span);
        if (rest.length) frag.appendChild(doc.createTextNode(rest));
        tn.parentNode?.replaceChild(frag, tn);
        break;
      }
      tn = walker.nextNode();
    }
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

function transformChapterHeading(html: string) {
  try {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    // If we've previously wrapped headings into a .chapter-heading, convert
    // them back into a single heading like "Chapter 4—The Waldenses" so the
    // original inline style is restored.
    const wrappers = Array.from(doc.body.querySelectorAll('.chapter-heading'));
    if (wrappers.length) {
      wrappers.forEach((wrapper) => {
        const numEl = wrapper.querySelector('.chapter-number');
        const titleEl = wrapper.querySelector('.chapter-title');
        let level = 'h2';
        if (titleEl && (titleEl.tagName || '').match(/^H[1-6]$/i)) level = titleEl.tagName.toLowerCase();
        const heading = doc.createElement(level);
        heading.className = 'chapterhead';
        const numText = (numEl && (numEl.textContent || '').trim()) || '';
        const titleText = (titleEl && (titleEl.textContent || '').trim()) || '';
        if (numText && titleText) {
          // Normalize label to title-case "Chapter N" then a dash and the title.
          // Wrap the "Chapter N" portion in a span so we can style it separately
          // (unbold the label while keeping the title bold).
          const normalizedNum = numText.replace(/^CHAPTER\s*/i, 'Chapter ');
          const numSpan = doc.createElement('span');
          numSpan.className = 'chapter-num-inline';
          numSpan.textContent = normalizedNum;
          heading.appendChild(numSpan);
          const sep = doc.createElement('span');
          sep.className = 'chapter-sep-inline';
          sep.textContent = ' — ';
          heading.appendChild(sep);
          const titleSpan = doc.createElement('span');
          titleSpan.className = 'chapter-title-inline';
          titleSpan.textContent = titleText;
          heading.appendChild(titleSpan);
        } else if (titleText) {
          heading.textContent = titleText;
        } else {
          heading.textContent = (wrapper.textContent || '').trim();
        }
        wrapper.parentNode?.replaceChild(heading, wrapper);
      });
      return doc.body.innerHTML;
    }
    // No wrapper present — nothing to transform.
    return html;
  } catch {
    return html;
  }
}

function escapeHtml(input: string) {
  return (input || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseAmharicBook(raw: string): { toc: TocEntry[]; chapterIds: string[]; chapterHtml: string[] } {
  const lines = (raw || '').replace(/\r\n?/g, '\n').split('\n');
  const chapterHeading = /^\s*ምዕራፍ\s+([^\s—-]+)\s*[—-]\s*(.+)\s*$/;

  type Section = { id: string; title: string; lines: string[] };
  const sections: Section[] = [];

  let introLines: string[] = [];
  let current: Section | null = null;
  let chapterCount = 0;

  const pushCurrent = () => {
    if (!current) return;
    sections.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(chapterHeading);
    if (match) {
      pushCurrent();
      chapterCount += 1;
      current = {
        id: `amh-ch-${chapterCount}`,
        title: trimmed,
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }
  pushCurrent();

  const introClean = introLines.join('\n').trim();
  if (introClean) {
    sections.unshift({
      id: 'amh-intro',
      title: 'መቅድም',
      lines: introLines,
    });
  }

  const toParagraphs = (sectionLines: string[]) => {
    const paras: string[] = [];
    let buf: string[] = [];
    const flush = () => {
      const t = buf.join(' ').replace(/\s+/g, ' ').trim();
      if (t) paras.push(`<p>${escapeHtml(t)}</p>`);
      buf = [];
    };

    sectionLines.forEach((ln) => {
      const t = (ln || '').trim();
      if (!t) {
        flush();
      } else {
        buf.push(t);
      }
    });
    flush();
    return paras.join('\n');
  };

  const toc: TocEntry[] = sections.map((s) => ({ title: s.title, href: `#${s.id}` }));
  const chapterIds = sections.map((s) => s.id);
  const chapterHtml = sections.map((s) => {
    const headingTag = s.id === 'amh-intro' ? 'h2' : 'h2';
    const heading = `<${headingTag} class="chapterhead">${escapeHtml(s.title)}</${headingTag}>`;
    const body = toParagraphs(s.lines);
    return `<div id="${s.id}">\n${heading}\n${body}\n</div>`;
  });

  return { toc, chapterIds, chapterHtml };
}

function parseChineseBook(raw: string): { toc: TocEntry[]; chapterIds: string[]; chapterHtml: string[] } {
  const lines = (raw || '').replace(/\r\n?/g, '\n').split('\n');
  const chapterHeading = /^\s*第\s*([0-9０-９]{1,3}|[一二三四五六七八九十百千〇零两兩]{1,6})\s*章\s*[—–\-：:]?\s*(.*?)\s*$/;
  const gcsMarker = /\bGCS\s*\d+(?:\.\d+)?\b/gi;

  type Section = { id: string; title: string; lines: string[] };
  const sections: Section[] = [];

  let introLines: string[] = [];
  let current: Section | null = null;
  let chapterCount = 0;

  const pushCurrent = () => {
    if (!current) return;
    sections.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(chapterHeading);
    if (match) {
      pushCurrent();
      chapterCount += 1;
      const chapterNo = (match[1] || '').trim();
      const chapterTail = (match[2] || '').trim();
      current = {
        id: `zh-ch-${chapterCount}`,
        title: chapterTail ? `第${chapterNo}章 ${chapterTail}` : `第${chapterNo}章`,
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }
  pushCurrent();

  const introClean = introLines.join('\n').trim();
  if (introClean) {
    sections.unshift({
      id: 'zh-intro',
      title: '引言',
      lines: introLines,
    });
  }

  const toParagraphs = (sectionLines: string[]) => {
    const paras: string[] = [];
    let buf: string[] = [];
    const flush = () => {
      const t = buf
        .join(' ')
        .replace(gcsMarker, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (t) paras.push(`<p>${escapeHtml(t)}</p>`);
      buf = [];
    };

    sectionLines.forEach((ln) => {
      const t = (ln || '').trim();
      if (!t) {
        flush();
      } else {
        buf.push(t);
      }
    });
    flush();
    return paras.join('\n');
  };

  const toc: TocEntry[] = sections.map((s) => ({ title: s.title, href: `#${s.id}` }));
  const chapterIds = sections.map((s) => s.id);
  const chapterHtml = sections.map((s) => {
    const heading = `<h2 class="chapterhead">${escapeHtml(s.title)}</h2>`;
    const body = toParagraphs(s.lines);
    return `<div id="${s.id}">\n${heading}\n${body}\n</div>`;
  });

  return { toc, chapterIds, chapterHtml };
}

function parseSerbianBook(raw: string): { toc: TocEntry[]; chapterIds: string[]; chapterHtml: string[] } {
  const lines = (raw || '').replace(/\r\n?/g, '\n').split('\n');
  const chapterHeading = /^\s*Поглавље\s+([IVXLCDM]+|\d+)\s*[—–\-:]\s*(.*?)\s*$/i;

  type Section = { id: string; title: string; lines: string[] };
  const sections: Section[] = [];
  let current: Section | null = null;
  let chapterCount = 0;

  const pushCurrent = () => {
    if (!current) return;
    sections.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = (line || '').trim();
    const match = trimmed.match(chapterHeading);
    if (match) {
      pushCurrent();
      chapterCount += 1;
      current = {
        id: `sr-ch-${chapterCount}`,
        title: trimmed,
        lines: [],
      };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }
  pushCurrent();

  const toParagraphs = (sectionLines: string[]) => {
    const paras: string[] = [];
    let buf: string[] = [];
    const flush = () => {
      const t = buf.join(' ').replace(/\s+/g, ' ').trim();
      if (t) paras.push(`<p>${escapeHtml(t)}</p>`);
      buf = [];
    };

    sectionLines.forEach((ln) => {
      const t = (ln || '').trim();
      if (!t) flush();
      else buf.push(t);
    });
    flush();
    return paras.join('\n');
  };

  const toc: TocEntry[] = sections.map((s) => ({ title: s.title, href: `#${s.id}` }));
  const chapterIds = sections.map((s) => s.id);
  const chapterHtml = sections.map((s) => {
    const heading = `<h2 class="chapterhead">${escapeHtml(s.title)}</h2>`;
    const body = toParagraphs(s.lines);
    return `<div id="${s.id}">\n${heading}\n${body}\n</div>`;
  });

  return { toc, chapterIds, chapterHtml };
}

function parseFarsiBook(raw: string): { toc: TocEntry[]; chapterIds: string[]; chapterHtml: string[] } {
  const lines = (raw || '').replace(/\r\n?/g, '\n').split('\n');
  const chapterMarker = /^\s*@@CHAPTER@@\s*(.+?)\s*$/;

  type Section = { id: string; title: string; lines: string[] };
  const sections: Section[] = [];
  let current: Section | null = null;
  let chapterCount = 0;

  const pushCurrent = () => {
    if (!current) return;
    sections.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = (line || '').trim();
    const match = trimmed.match(chapterMarker);
    if (match) {
      pushCurrent();
      chapterCount += 1;
      current = {
        id: `fa-ch-${chapterCount}`,
        title: (match[1] || '').trim(),
        lines: [],
      };
      continue;
    }

    if (current) current.lines.push(line);
  }
  pushCurrent();

  const toParagraphs = (sectionLines: string[]) => {
    const paras: string[] = [];
    let buf: string[] = [];
    const flush = () => {
      const t = buf.join(' ').replace(/\s+/g, ' ').trim();
      if (t) paras.push(`<p>${escapeHtml(t)}</p>`);
      buf = [];
    };

    sectionLines.forEach((ln) => {
      const t = (ln || '').trim();
      if (!t) flush();
      else buf.push(t);
    });
    flush();
    return paras.join('\n');
  };

  const toc: TocEntry[] = sections.map((s) => ({ title: s.title, href: `#${s.id}` }));
  const chapterIds = sections.map((s) => s.id);
  const chapterHtml = sections.map((s) => {
    const heading = `<h2 class="chapterhead">${escapeHtml(s.title)}</h2>`;
    const body = toParagraphs(s.lines);
    return `<div id="${s.id}">\n${heading}\n${body}\n</div>`;
  });

  return { toc, chapterIds, chapterHtml };
}

export default function BookReader() {
  type ReaderBookmark = { lang: string; chapterIdx: number; ts: number };
  // --- SEARCH & SHARE POPUP STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ idx: number; occ: number }>>([]);
  const [searchIdx, setSearchIdx] = useState(0);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [pendingScroll, setPendingScroll] = useState<{ idx: number; occ: number } | null>(null);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedAnchorId, setSelectedAnchorId] = useState<string | null>(null);
  const [sharePopupPos, setSharePopupPos] = useState({ top: 0, left: 0 });

  // --- AUDIO STATE ---
  const [audioMinimized, setAudioMinimized] = useState(false);

  // --- MAIN APP STATE ---
  const [lang, setLang] = useState(LANGUAGE_FOLDERS[0]);
  const [toc, setToc] = useState<TocEntry[]>([]);
  const [bookDoc, setBookDoc] = useState<Document | null>(null);
  const [chapterIds, setChapterIds] = useState<string[]>([]);
  const chapterCache = useRef<Map<number, string>>(new Map());
  const plainTextCache = useRef<Map<number, string>>(new Map());
  const [chapterIdx, setChapterIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageWidth, setPageWidth] = useState(() => {
    const saved = localStorage.getItem('reader-page-width');
    if (saved) {
      const n = Number(saved);
      if (!Number.isNaN(n)) {
        return Math.max(DESKTOP_WIDTH_MIN, Math.min(DESKTOP_WIDTH_MAX, n));
      }
    }
    return getRecommendedDesktopWidth(window.innerWidth || 1280);
  });
  const [desktopWidthLimit, setDesktopWidthLimit] = useState(() =>
    Math.max(DESKTOP_WIDTH_MIN, Math.min(DESKTOP_WIDTH_MAX, (window.innerWidth || 1280) - 48))
  );
  const [textSize, setTextSize] = useState(() => {
    const v = localStorage.getItem('reader-text-size');
    return v ? Number(v) : 18;
  });
  const [isDesktop, setIsDesktop] = useState(true);
  const [showChaptersMenu, setShowChaptersMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [copyToastPos, setCopyToastPos] = useState({ top: 0, left: 0 });
  const [bookmark, setBookmark] = useState<ReaderBookmark | null>(() => {
    try {
      const raw = localStorage.getItem('reader-bookmark');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as ReaderBookmark;
      if (!parsed || typeof parsed.lang !== 'string' || typeof parsed.chapterIdx !== 'number') return null;
      return parsed;
    } catch {
      return null;
    }
  });
  const [showOpeningToc, setShowOpeningToc] = useState(() => {
    // Show the TOC page only on the root route (/) or language-only routes (/{lang}).
    // If navigating via a deep link (chapter route) or a paragraph hash, don't force the TOC.
    const path = window.location.pathname || '/';
    const hasHashFragment = !!(window.location.hash && window.location.hash.startsWith('#gc-p-'));
    if (hasHashFragment) return false;

    const isRoot = path === '/' || path === '';
    if (isRoot) return true;

    const m = path.match(/^\/([^/]+)\/?$/);
    if (m) {
      const slug = decodeURIComponent(m[1] || '').toLowerCase();
      if (LANG_SLUG_TO_FOLDER[slug]) return true;
    }

    // Any route with 2+ segments should be treated as a deep link.
    return false;
  });
  const sharePopupRef = useRef<HTMLDivElement | null>(null);
  const selectionRangeRef = useRef<Range | null>(null);
  const isSelectingRef = useRef(false);
  const pendingChapterIdxRef = useRef<number | null>(null);
  const pendingChapterNumberRef = useRef<number | null>(null);
  const copyToastTimerRef = useRef<number | null>(null);
  const lastSelectionRectRef = useRef<DOMRect | null>(null);

  // theme state: keep in React state so UI updates immediately when toggled
  const [isDark, setIsDark] = useState(() => localStorage.getItem('reader-dark') === '1');

  const contentRef = useRef<HTMLDivElement | null>(null);
  const langBtnRef = useRef<HTMLButtonElement | null>(null);
  const burgerBtnRef = useRef<HTMLButtonElement | null>(null);
  const searchBtnRef = useRef<HTMLButtonElement | null>(null);
  const shareBtnRef = useRef<HTMLButtonElement | null>(null);
  const shareMenuRef = useRef<HTMLDivElement | null>(null);
  const chaptersMenuRef = useRef<HTMLDivElement | null>(null);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const moreBtnRef = useRef<HTMLButtonElement | null>(null);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);

  // Handlers for next/prev chapter (for audio auto-next)
  const handleNextChapter = () => {
    if (chapterIdx < toc.length - 1) setChapterIdx(chapterIdx + 1);
  };
  const handlePrevChapter = () => {
    if (chapterIdx > 0) setChapterIdx(chapterIdx - 1);
  };
  // Get current chapter title
  const chapterTitle = toc[chapterIdx]?.title || '';

  // --- Minimized audio bar and auto-next logic ---
  // Auto-minimize audio bar on scroll (mobile)
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y > 120) setAudioMinimized(true);
          else setAudioMinimized(false);
          lastY = y;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // --- Minimized audio bar and auto-next logic ---

  const clearTempHighlights = () => {
    const contentEl = contentRef.current;
    if (!contentEl) return;
    contentEl.querySelectorAll('span.user-highlight-temp').forEach((el) => {
      const parent = el.parentNode;
      while (el.firstChild) parent?.insertBefore(el.firstChild, el);
      parent?.removeChild(el);
    });
  };

  const applyPersistentHighlight = (range: Range) => {
    clearTempHighlights();
    const common = range.commonAncestorContainer;
    const root = common.nodeType === Node.ELEMENT_NODE ? (common as Element) : (common.parentElement || null);
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (node: Node) => {
        const text = node.nodeValue || '';
        if (!text.trim()) return NodeFilter.FILTER_REJECT;
        try {
          return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        } catch {
          return NodeFilter.FILTER_REJECT;
        }
      },
    } as any);

    const nodes: Text[] = [];
    let n = walker.nextNode();
    while (n) {
      nodes.push(n as Text);
      n = walker.nextNode();
    }
    nodes.forEach((textNode) => {
      const fullText = textNode.nodeValue || '';
      if (!fullText) return;
      let startOffset = 0;
      let endOffset = fullText.length;
      if (textNode === range.startContainer) startOffset = range.startOffset;
      if (textNode === range.endContainer) endOffset = range.endOffset;
      if (startOffset === endOffset) return;

      let nodeToWrap = textNode;
      if (endOffset < nodeToWrap.length) {
        nodeToWrap.splitText(endOffset);
      }
      if (startOffset > 0) {
        nodeToWrap = nodeToWrap.splitText(startOffset);
      }
      const span = document.createElement('span');
      span.className = 'user-highlight user-highlight-temp';
      span.textContent = nodeToWrap.nodeValue || '';
      nodeToWrap.parentNode?.replaceChild(span, nodeToWrap);
    });
  };

  const [langPanelStyle, setLangPanelStyle] = useState<React.CSSProperties | null>(null);
  const [chaptersPanelStyle, setChaptersPanelStyle] = useState<React.CSSProperties | null>(null);
  const [searchPanelStyle, setSearchPanelStyle] = useState<React.CSSProperties | null>(null);
  const [sharePanelStyle, setSharePanelStyle] = useState<React.CSSProperties | null>(null);
  const [morePanelStyle, setMorePanelStyle] = useState<React.CSSProperties | null>(null);

  const getAnchoredPanelStyle = (btn: HTMLButtonElement | null, preferredWidth = 260): React.CSSProperties => {
    const viewportWidth = window.innerWidth;
    const margin = 12;
    const maxAllowed = Math.max(160, viewportWidth - margin * 2);
    const width = Math.min(preferredWidth, maxAllowed);

    if (!btn) {
      return {
        position: 'fixed',
        top: 72,
        left: margin,
        width,
        maxWidth: `calc(100vw - ${margin * 2}px)`,
        zIndex: 9999,
      };
    }

    const r = btn.getBoundingClientRect();
    let left = r.left;
    if (left + width + margin > viewportWidth) left = viewportWidth - width - margin;
    if (left < margin) left = margin;

    return {
      position: 'fixed',
      top: r.bottom + 8,
      left,
      width,
      maxWidth: `calc(100vw - ${margin * 2}px)`,
      zIndex: 9999,
    };
  };

  useEffect(() => {
    const mq = window.matchMedia('(min-width:900px)');
    const fn = () => setIsDesktop(!!mq.matches);
    fn();
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);

  useEffect(() => {
    const updateDesktopWidth = () => {
      const limit = Math.max(
        DESKTOP_WIDTH_MIN,
        Math.min(DESKTOP_WIDTH_MAX, window.innerWidth - 48)
      );
      setDesktopWidthLimit(limit);
      setPageWidth((w) => Math.min(w, limit));
    };

    updateDesktopWidth();
    window.addEventListener('resize', updateDesktopWidth);
    return () => window.removeEventListener('resize', updateDesktopWidth);
  }, []);

  useEffect(() => {
    localStorage.setItem('reader-page-width', String(pageWidth));
  }, [pageWidth]);

  useEffect(() => {
    if (!showShareMenu) return;
    const onDown = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      if (target && shareMenuRef.current?.contains(target)) return;
      if (target && shareBtnRef.current?.contains(target)) return;
      setShowShareMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [showShareMenu]);

  useEffect(() => {
    if (!showChaptersMenu) return;
    const onDown = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      if (target && chaptersMenuRef.current?.contains(target)) return;
      if (target && burgerBtnRef.current?.contains(target)) return;
      setShowChaptersMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [showChaptersMenu]);

  useEffect(() => {
    if (!showLangMenu) return;
    const onDown = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      if (target && langMenuRef.current?.contains(target)) return;
      if (target && langBtnRef.current?.contains(target)) return;
      setShowLangMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [showLangMenu]);

  useEffect(() => {
    if (!showMoreMenu) return;
    const onDown = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      if (target && moreMenuRef.current?.contains(target)) return;
      if (target && moreBtnRef.current?.contains(target)) return;
      setShowMoreMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [showMoreMenu]);

  // Parse path-based routes like /lang/en/chapter/23 on initial load
  useEffect(() => {
    const parsePath = (path: string) => {
      // Language-only format: /{lang} - show TOC menu
      let m = path.match(/^\/([^/]+)\/?$/i);
      if (m) {
        const abbr = decodeURIComponent(m[1] || '').toLowerCase();
        const folder = LANG_SLUG_TO_FOLDER[abbr];
        if (folder) return { folder, idx: null, num: null, showToc: true };
      }
      // New format: /{lang}/{label}-{num}/{slug}
      m = path.match(/^\/([^/]+)\/[^/]+-(\d+)\/([^/]+)?(?:\/)?$/i);
      if (m) {
        const abbr = decodeURIComponent(m[1] || '').toLowerCase();
        const num = Math.max(1, parseInt(m[2], 10));
        const idx = Math.max(0, num - 1);
        const folder = LANG_SLUG_TO_FOLDER[abbr];
        if (!folder) return null;
        return { folder, idx, num, showToc: false };
      }
      // Backward compatible: /{lang}/chapter/{num}-{slug}
      m = path.match(/^\/([^/]+)\/chapter\/(\d+)(?:-([^/]+))?(?:\/)?$/i);
      if (!m) return null;
      const abbr = decodeURIComponent(m[1] || '').toLowerCase();
      const num = Math.max(1, parseInt(m[2], 10));
      const idx = Math.max(0, num - 1);
      const folder = LANG_SLUG_TO_FOLDER[abbr];
      if (!folder) return null;
      return { folder, idx, num, showToc: false };
    };

    const parsed = parsePath(window.location.pathname);
    if (parsed) {
      if (parsed.idx !== null) {
        pendingChapterIdxRef.current = parsed.idx;
        pendingChapterNumberRef.current = parsed.num ?? null;
      }
      setLang(parsed.folder);
      setShowOpeningToc(parsed.showToc ?? false);
    }

    const onPop = () => {
      const p = parsePath(window.location.pathname);
      if (p) {
        if (p.idx !== null) {
          pendingChapterIdxRef.current = p.idx;
          pendingChapterNumberRef.current = p.num ?? null;
        }
        setLang(p.folder);
        setShowOpeningToc(p.showToc ?? false);
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Persist theme preference and apply to document element
  useEffect(() => {
    try {
      localStorage.setItem('reader-dark', isDark ? '1' : '0');
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore storage errors in strict environments
    }
  }, [isDark]);

  // Handle RTL for Arabic and other RTL languages
  useEffect(() => {
    const isArabic = lang && lang.toLowerCase().includes('alsra');
    const isFarsi = lang === FARSI_FOLDER;
    const isRTL = isArabic || isFarsi;
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    if (isRTL) {
      document.documentElement.setAttribute('lang', 'ar');
    }
  }, [lang]);

  // Remove auto-highlight and share popup on selection end: restore standard selection behavior.
  // The share/copy popup will only be shown when the user explicitly triggers it (e.g., via a button in the UI).

  // Track selection gesture state to avoid fighting user selection changes
  useEffect(() => {
    const onDown = (ev: PointerEvent) => {
      const target = ev.target as Node | null;
      if (target && contentRef.current?.contains(target)) {
        isSelectingRef.current = true;
      }
    };
    const onUp = () => {
      isSelectingRef.current = false;
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('pointerup', onUp);
    };
  }, []);

  // Copy selected text to clipboard (include title + link)
  const handleCopy = async () => {
    try {
      const bookTitle = getBookTitleFromFolder(lang);
      const baseUrl = `${window.location.origin}${window.location.pathname}`;
      const url = selectedAnchorId ? `${baseUrl}#${selectedAnchorId}` : window.location.href;
      const payloadText = `${selectedText}${selectedText ? '\n\n' : ''}${bookTitle}\n${url}`;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(payloadText);
      } else {
        // Fallback for older browsers / non-https contexts
        const ta = document.createElement('textarea');
        ta.value = payloadText;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setShowSharePopup(false);
      // restore iOS touch callout when popup closed
      try {
        if (contentRef.current && (contentRef.current as any).style) {
          (contentRef.current as any).style.webkitTouchCallout = '';
        }
      } catch {}
      window.getSelection()?.removeAllRanges();
      if (lastSelectionRectRef.current) {
        const r = lastSelectionRectRef.current;
        setCopyToastPos({
          top: r.top + window.scrollY - 40,
          left: r.left + window.scrollX + Math.max(r.width / 2, 0),
        });
      } else {
        setCopyToastPos({
          top: Math.max(16, window.scrollY + 16),
          left: Math.max(16, window.innerWidth / 2),
        });
      }
      setShowCopyToast(true);
      if (copyToastTimerRef.current) window.clearTimeout(copyToastTimerRef.current);
      copyToastTimerRef.current = window.setTimeout(() => setShowCopyToast(false), 1600);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Ensure the original selection stays visible while interacting with the popup
  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel || !selectionRangeRef.current) return;
    try {
      sel.removeAllRanges();
      sel.addRange(selectionRangeRef.current.cloneRange());
    } catch {
      // ignore
    }
  };

  // Keep the highlight visible when the popup appears/re-renders
  useEffect(() => {
    if (showSharePopup && selectedText && selectionRangeRef.current) {
      restoreSelection();
    }
  }, [showSharePopup, selectedText]);

  // Keep share popup near selected text while scrolling/resizing so it stays in viewport
  useEffect(() => {
    if (!showSharePopup) return;

    const reposition = () => {
      let rect: DOMRect | null = null;
      try {
        rect = selectionRangeRef.current?.getBoundingClientRect?.() || null;
      } catch {
        rect = null;
      }

      if (rect) {
        const isIOS = typeof navigator !== 'undefined' && /iP(ad|hone|od)/i.test(navigator.userAgent || '');
        const nativeOffset = isIOS ? 110 : 56;
        setSharePopupPos({
          top: rect.top - nativeOffset,
          left: rect.left + Math.max(rect.width / 2, 0),
        });
        lastSelectionRectRef.current = rect;
      }
    };

    reposition();
    window.addEventListener('scroll', reposition, { passive: true });
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition);
      window.removeEventListener('resize', reposition);
    };
  }, [showSharePopup]);

  // Show a lightweight share popup when the user selects text, but do NOT
  // alter the browser selection or apply persistent highlights. This preserves
  // the standard selection visuals while providing a white share modal.
  useEffect(() => {
    const onPointerUp = (ev?: Event) => {
      try {
        const sel = window.getSelection();
        const txt = sel ? (sel.toString() || '').trim() : '';
        const anchor = sel?.anchorNode || null;
        if (!txt || !anchor || !contentRef.current?.contains(anchor)) return;
        const range = sel!.rangeCount ? sel!.getRangeAt(0) : null;
        if (!range) return;

        // Determine an anchor id for linking back to the paragraph
        const containerEl = (range.startContainer as Element)?.nodeType === Node.ELEMENT_NODE
          ? (range.startContainer as Element)
          : (range.startContainer.parentElement || null);
        const blockEl = containerEl?.closest?.('p, blockquote') || containerEl?.closest?.('[id]') || null;
        let anchorId: string | null = null;
        if (blockEl && (blockEl as Element).id) anchorId = (blockEl as Element).id;
        if (!anchorId && contentRef.current) {
          const blocks = Array.from(contentRef.current.querySelectorAll('p, blockquote')) as HTMLElement[];
          const idx = blockEl ? blocks.indexOf(blockEl as HTMLElement) : -1;
          const fallbackIdx = idx >= 0 ? idx + 1 : Math.max(1, blocks.length);
          anchorId = `gc-p-${chapterIdx + 1}-${fallbackIdx}`;
          if (blockEl && !(blockEl as Element).id) (blockEl as Element).id = anchorId;
        }

        const rect = range.getBoundingClientRect();
        lastSelectionRectRef.current = rect;
        selectionRangeRef.current = range.cloneRange();
        setSelectedText(txt);
        setSelectedAnchorId(anchorId);
        // Adjust popup vertical offset to avoid iOS native selection menu overlapping
        const isIOS = typeof navigator !== 'undefined' && /iP(ad|hone|od)/i.test(navigator.userAgent || '');
        // Increase offset slightly so our popup sits above the iOS native menu.
        const nativeOffset = isIOS ? 110 : 56; // iOS native menu can occupy more space
        setSharePopupPos({
          top: rect.top - nativeOffset,
          left: rect.left + Math.max(rect.width / 2, 0),
        });
        setShowSharePopup(true);
        // Temporarily disable iOS native touch callout so the app popup is used
        try {
          if (isIOS && contentRef.current && (contentRef.current as any).style) {
            (contentRef.current as any).style.webkitTouchCallout = 'none';
          }
        } catch {}
        // Do NOT call applyPersistentHighlight — preserve native selection visuals
      } catch {
        // ignore
      }
    };

    document.addEventListener('pointerup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);
    return () => {
      document.removeEventListener('pointerup', onPointerUp);
      document.removeEventListener('touchend', onPointerUp);
    };
  }, [chapterIdx]);

  // Note: selectionchange handling removed to prevent flashing on mobile/desktop.

  // Close share popup when clicking outside content and the popup
  useEffect(() => {
    if (!showSharePopup) return;
    const onDown = (ev: MouseEvent | TouchEvent) => {
      const target = ev.target as Node | null;
      if (target && sharePopupRef.current?.contains(target)) return;
      if (target && contentRef.current?.contains(target)) return;
      setShowSharePopup(false);
      setSelectedAnchorId(null);
      // restore iOS touch callout when popup closed
      try {
        if (contentRef.current && (contentRef.current as any).style) {
          (contentRef.current as any).style.webkitTouchCallout = '';
        }
      } catch {}
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [showSharePopup]);

  // Share on social media
  const handleShare = (platform: string) => {
    const bookTitle = getBookTitleFromFolder(lang);
    const text = `"${selectedText}" — ${bookTitle}`;
    const baseUrl = `${window.location.origin}${window.location.pathname}`;
    const url = selectedAnchorId ? `${baseUrl}#${selectedAnchorId}` : window.location.href;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(bookTitle)}&body=${encodeURIComponent(text + '\n\n' + url)}`;
        break;
      case 'native':
        if (navigator.share) {
          // Some share targets (like Messages on iOS) ignore `text` when `url` is present.
          // Put everything into `text` and omit `url` so the quote always appears.
          const payloadText = `${selectedText}${selectedText ? '\n\n' : ''}${bookTitle}\n${url}`;
          navigator.share({ title: bookTitle, text: payloadText })
            .catch(err => console.log('Share cancelled:', err));
          setShowSharePopup(false);
          // restore iOS touch callout when popup closed
          try {
            if (contentRef.current && (contentRef.current as any).style) {
              (contentRef.current as any).style.webkitTouchCallout = '';
            }
          } catch {}
          window.getSelection()?.removeAllRanges();
          return;
        }
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=720,height=520');
      setShowSharePopup(false);
      // restore iOS touch callout when popup closed
      try {
        if (contentRef.current && (contentRef.current as any).style) {
          (contentRef.current as any).style.webkitTouchCallout = '';
        }
      } catch {}
      window.getSelection()?.removeAllRanges();
    }
  };

  // Clear persistent highlights when chapter or language changes
  useEffect(() => {
    clearTempHighlights();
    selectionRangeRef.current = null;
    setSelectedAnchorId(null);
  }, [chapterIdx, lang]);

  useEffect(() => {
    return () => {
      if (copyToastTimerRef.current) window.clearTimeout(copyToastTimerRef.current);
    };
  }, []);

  const handleShareApp = (platform: string) => {
    const bookTitle = getBookTitleFromFolder(lang) || (lang || '').split(' - Ellen')[0].trim() || 'The Great Controversy';
    const url = `${window.location.origin}${window.location.pathname}`;
    const text = `${bookTitle} — ${url}`;

    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(bookTitle)}&body=${encodeURIComponent(text)}`;
        break;
      case 'native':
        if (navigator.share) {
          navigator.share({ title: bookTitle, text: bookTitle, url })
            .catch(() => null);
          return;
        }
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=720,height=520');
    }
  };


  useEffect(() => {
    // When language changes, clear previous content immediately and try to
    // load the selected language folder's index.html. We try a couple of
    // URL formats (encoded and raw) because some language folder names
    // contain characters that can be tricky when served from the dev server.
    setLoading(true);
    setToc([]);
    setChapterIds([]);
    setBookDoc(null);
    chapterCache.current.clear();
    plainTextCache.current.clear();
    setChapterIdx(0);

    const tryFetch = async (paths: string[]) => {
      for (const p of paths) {
        try {
          const r = await fetch(p);
          if (!r.ok) continue;
          const html = await r.text();

          // Some hosts (Netlify with Pretty URLs / path normalization) may
          // respond to "/.../index.html" with a small "Document moved" page.
          // If we parse that as a book, the TOC will be empty.
          const moved = /<title>\s*document moved\s*<\/title>/i.test(html) || /document moved permanently/i.test(html);
          if (moved) continue;

          return html;
        } catch (e) {
          // continue to next candidate
        }
      }
      throw new Error('Not found');
    };

    if (lang === AMHARIC_FOLDER || lang === CHINESE_FOLDER || lang === SERBIAN_FOLDER || lang === FARSI_FOLDER) {
      const sourcePath =
        lang === AMHARIC_FOLDER
          ? AMHARIC_SOURCE_PATH
          : lang === CHINESE_FOLDER
            ? CHINESE_SOURCE_PATH
            : lang === SERBIAN_FOLDER
              ? SERBIAN_SOURCE_PATH
              : FARSI_SOURCE_PATH;
      fetch(sourcePath)
        .then((r) => {
          if (!r.ok) throw new Error('Source file missing');
          return r.text();
        })
        .then((raw) => {
          const parsed =
            lang === AMHARIC_FOLDER
              ? parseAmharicBook(raw)
              : lang === CHINESE_FOLDER
                ? parseChineseBook(raw)
                : lang === SERBIAN_FOLDER
                  ? parseSerbianBook(raw)
                  : parseFarsiBook(raw);
          setToc(parsed.toc);
          setChapterIds(parsed.chapterIds);
          setBookDoc(null);

          chapterCache.current.clear();
          plainTextCache.current.clear();
          parsed.chapterHtml.forEach((html, i) => {
            chapterCache.current.set(i, html);
            plainTextCache.current.set(i, html.replace(/<[^>]+>/g, ' '));
          });

          let defaultIdx = 0;
          const desiredNumber = pendingChapterNumberRef.current;
          const desiredIdx = pendingChapterIdxRef.current;
          if (typeof desiredNumber === 'number') {
            const idxFromNum = Math.max(0, Math.min(parsed.chapterIds.length - 1, desiredNumber - 1));
            setChapterIdx(idxFromNum);
          } else if (typeof desiredIdx === 'number' && desiredIdx >= 0 && desiredIdx < parsed.chapterIds.length) {
            setChapterIdx(desiredIdx);
          } else {
            setChapterIdx(defaultIdx);
          }

          pendingChapterIdxRef.current = null;
          pendingChapterNumberRef.current = null;
          setLoading(false);
        })
        .catch(() => {
          setToc([]);
          setChapterIds([]);
          setBookDoc(null);
          chapterCache.current.clear();
          plainTextCache.current.clear();
          setLoading(false);
        });
      return;
    }

    const encodedBase = `/book-content/html/${encodeURIComponent(lang)}`;
    const rawBase = `/book-content/html/${lang}`;
    const candidates = [
      // Most common
      `${encodedBase}/index.html`,
      `${encodedBase}/`,
      // Fallback for tricky characters / dev-server quirks
      `${rawBase}/index.html`,
      `${rawBase}/`,
    ];

    tryFetch(candidates)
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        // Try several strategies to locate a table-of-contents
        let tocRoot: Element | null = doc.querySelector('nav[type="toc"]') || doc.querySelector('nav.toc') || doc.querySelector('.toc') || doc.querySelector('#toc') || doc.querySelector('ol');
        const entries: TocEntry[] = [];
        const isInfoPage = (t: string) => /^\s*information\s+about.*book/i.test(t.trim());
        const shouldSkipToc = (t: string) => {
          const s = (t || '').trim();
          if (!s) return true;
          if (isInfoPage(s)) return true;
          if (/^\s*(?:preface|foreword)\b/i.test(s)) return true;
          // Language-specific exclusions (Spanish titles)
          const langName = (LANGUAGE_NAMES[lang] || '').toLowerCase();
          if (langName.includes('span')) {
            // "Información sobre este libro" / "Información sobre el libro"
            if (/^\s*(?:informaci[oó]n\s+sobre(?:\s+este|\s+el)?\s+libro)\b/i.test(s)) return true;
            // "Prefacio" or "Prólogo"
            if (/^\s*(?:prefacio|pr[oó]logo)\b/i.test(s)) return true;
          }
          // Do NOT skip Introduction — show it in contents
          return false;
        };
        if (tocRoot) {
          tocRoot.querySelectorAll('a').forEach((a) => {
            const href = a.getAttribute('href') || '';
            const title = (a.textContent || '').trim();
            if (href && title && !shouldSkipToc(title)) entries.push({ title, href });
          });
        }
        // Fallback: collect anchors that reference in-page ids and point to existing elements
        if (!entries.length || entries.length < 3) {
          const seen = new Set<string>();
          const all = Array.from(doc.querySelectorAll('a[href]'));
          all.forEach((a) => {
            const href = a.getAttribute('href') || '';
            if (!href.startsWith('#')) return;
            const id = href.replace(/^#/, '');
            if (!id) return;
            if (!doc.getElementById(id)) return;
            const title = (a.textContent || '').trim();
            if (!title) return;
            if (shouldSkipToc(title)) return;
            if (seen.has(href)) return;
            seen.add(href);
            entries.push({ title, href });
          });
        }
        // Additional fallback: extract chapters from h2 headings if TOC is still sparse
        if (entries.length < 3) {
          const headings = Array.from(doc.querySelectorAll('h2.chapterhead, h2[class*="chapter"]'));
          const fallbackEntries: TocEntry[] = [];
          headings.forEach((h) => {
            const title = (h.textContent || '').trim();
            if (!title || shouldSkipToc(title)) return;
            // Find the parent element with an id
            let el: Element | null = h;
            while (el && !el.id) {
              el = el.parentElement;
            }
            if (el && el.id) {
              fallbackEntries.push({ title, href: `#${el.id}` });
            }
          });
          if (fallbackEntries.length > entries.length) {
            entries.length = 0;
            entries.push(...fallbackEntries);
          }
        }
        
        // Filter TOC to start from Introduction onwards - hide everything before it
        const introductionIdx = entries.findIndex((e) => /\bintroduction\b/i.test(e.title));
        let filteredEntries = introductionIdx >= 0 ? entries.slice(introductionIdx) : entries;
        
        // Remove unwanted pages for German language
        if (lang === 'Der grosse Kampf - Ellen G. White') {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            const chNum = getChapterNumber(title);
            
            // Remove "Informationen zu diesem Buch" and "Vorwort"
            if (/informationen|vorwort/i.test(title)) return false;
            
            // Remove specific pages
            if (/untreue\s+und\s+abfall/i.test(title)) return false;
            
            // Remove chapters 2, 3, and 4
            if (chNum === 2 || chNum === 3 || chNum === 4) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Italian language
        if (lang === 'Il gran conflitto - Ellen G. White') {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "Informazioni su questo libro" and "Prefazione"
            if (/informazioni|prefazione/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Portuguese language
        if (lang === 'O Grande Conflito - Ellen G. White') {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "Informações sobre este livro"
            if (/informações/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Samoan language
        if (lang === 'O Le Finauga Tele - Ellen G. White') {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "UPU TOMUA"
            if (/upu\s+tomua/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Croatian language
        if (lang === 'VELIKA BORBA IZMEDU KRISTA I SOTONE - Ellen G. White') {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "Predgovor"
            if (/predgovor/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Bulgarian language
        if (lang === "VIeLIKATA BORBA MIeZhDU KhRISTA i SATANA - Ellen G. White") {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "Предговоръ"
            if (/предговор/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Romanian language
        if (lang === 'Tragedia veacurilor - Ellen G. White') {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "Informații despre această carte"
            if (/informații.*despre/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Czech language
        if (lang === 'Velky spor vekov - Ellen G. White') {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "Předmluva"
            if (/předmluva/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Russian language
        if (lang === "Vielikaia bor'ba - Ellen G. White") {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "Информация об этой книге" and "Предисловие"
            if (/информация.*об|предисловие/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Polish language
        if (lang === 'Wielki boj - Ellen G. White') {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "Wprowadzenie do wydania XV"
            if (/wprowadzenie.*do.*wydania/i.test(title)) return false;
            
            return true;
          });
        }
        
        // Remove unwanted pages for Arabic language
        if (lang === "alSra` al`Zym - Ellen G. White") {
          filteredEntries = filteredEntries.filter((e) => {
            const title = e.title || '';
            
            // Remove "المقدمة"
            if (/المقدمة/.test(title)) return false;
            
            return true;
          });
        }
        
        setToc(filteredEntries);
        
        // Choose a sensible default chapter to show first.
        // Always start at the first visible chapter (Introduction or first available)
        let defaultIdx = 0;
        const desiredNumber = pendingChapterNumberRef.current;
        const desiredIdx = pendingChapterIdxRef.current;
        if (typeof desiredNumber === 'number') {
          const matchIdx = filteredEntries.findIndex((e) => getChapterNumber(e.title) === desiredNumber);
          if (matchIdx >= 0) setChapterIdx(matchIdx);
          else if (typeof desiredIdx === 'number' && desiredIdx >= 0 && desiredIdx < filteredEntries.length) setChapterIdx(desiredIdx);
          else setChapterIdx(defaultIdx);
        } else if (typeof desiredIdx === 'number' && desiredIdx >= 0 && desiredIdx < filteredEntries.length) {
          setChapterIdx(desiredIdx);
        } else {
          setChapterIdx(defaultIdx);
        }
        pendingChapterIdxRef.current = null;
        pendingChapterNumberRef.current = null;
        // Store chapter IDs and parsed doc for lazy extraction
        const ids = filteredEntries.map((e) => e.href.replace(/^#/, ''));
        setChapterIds(ids);
        setBookDoc(doc);
        chapterCache.current.clear();
        plainTextCache.current.clear();
        setLoading(false);
        // Prefetch remaining chapters in idle time
        if ('requestIdleCallback' in window) {
          (window as any).requestIdleCallback(() => {
            ids.forEach((id, i) => {
              if (i === defaultIdx) return; // already rendered
              extractChapterHtml(doc, id, entries);
            });
          }, { timeout: 2000 });
        }
      })
      .catch(() => {
        // failed to load selected language — leave chapters empty so the UI
        // clearly indicates content isn't available rather than silently
        // showing the previous language's content.
        setToc([]);
        setChapterIds([]);
        setBookDoc(null);
        chapterCache.current.clear();
        plainTextCache.current.clear();
        setLoading(false);
      });
  }, [lang]);

  // Keep path in sync with current language/chapter
  useEffect(() => {
    if (!chapterIds.length) return;
    // Use short language code (ISO 639-1) for URLs
    const abbr = (LANGUAGE_ABBREV[lang] || '').toLowerCase();

     // Contents view: keep a stable language-only route so the opening page is linkable.
    if (showOpeningToc) {
      const path = abbr ? `/${abbr}` : '/';
      if (window.location.pathname !== path) {
        window.history.replaceState({}, '', path);
      }
      return;
    }

    const chapterTitle = toc[chapterIdx]?.title || '';
    const chapterNumber = getChapterNumber(chapterTitle) ?? (chapterIdx + 1);
    const strippedTitle = stripChapterPrefix(chapterTitle);
    const slug = slugifyAscii(strippedTitle || chapterTitle) || `chapter-${chapterNumber}`;
    const path = `/${abbr}/chapter-${chapterNumber}/${slug}`;
    if (window.location.pathname !== path) {
      window.history.replaceState({}, '', path);
    }
  }, [lang, chapterIdx, chapterIds.length, toc, showOpeningToc]);

  // Lazily extract and cache chapter HTML from the stored document
  function extractChapterHtml(doc: Document, id: string, entries: TocEntry[]): string {
    const el = doc.getElementById(id);
    if (!el) return '';
    let node: Element | null = el;
    let acc = '';
    while (node) {
      acc += node.outerHTML;
      const next = node.nextElementSibling;
      if (next && entries.some((en) => en.href.replace(/^#/, '') === next.id)) break;
      node = node.nextElementSibling;
    }
    return acc;
  }

  // Get chapter HTML, using cache or extracting on-demand
  function getChapterHtml(idx: number): string {
    if (chapterCache.current.has(idx)) return chapterCache.current.get(idx)!;
    if (!bookDoc || !chapterIds[idx]) return '';
    const html = extractChapterHtml(bookDoc, chapterIds[idx], toc);
    chapterCache.current.set(idx, html);
    return html;
  }

  // Get plain-text version of chapter for search (cached)
  function getChapterText(idx: number): string {
    if (plainTextCache.current.has(idx)) return plainTextCache.current.get(idx)!;
    const html = getChapterHtml(idx);
    const text = html.replace(/<[^>]+>/g, ' ');
    plainTextCache.current.set(idx, text);
    return text;
  }

  function runSearch() {
    // Support exact-phrase searches when the user wraps the query in
    // quotes (single or double). E.g. "the Lord" will only match that
    // exact phrase (word-boundary delimited), while unquoted queries
    // remain fuzzy/case-insensitive substring matches.
    const raw = (searchQuery || '').trim();
    let exact = false;
    let query = raw;
    // detect quoted phrase like "..." or '...'
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      query = raw.slice(1, -1).trim();
      exact = true;
    }
    if (!query) {
      setSearchResults([]);
      setHighlighted(null);
      return;
    }

    const esc = escapeRegExp(query);
    const results: { idx: number; occ: number }[] = [];
    for (let idx = 0; idx < chapterIds.length; idx++) {
      const text = getChapterText(idx);
      let m: RegExpExecArray | null;
      let occ = 0;
      const pattern = exact ? `\\b${esc}\\b` : esc;
      const runner = new RegExp(pattern, 'gi');
      while ((m = runner.exec(text)) !== null) {
        results.push({ idx, occ });
        occ++;
        if (runner.lastIndex === m.index) runner.lastIndex++;
      }
    }

    setSearchResults(results);
    if (results.length) {
      const first = results[0];
      setChapterIdx(first.idx);
      // Highlight using the (possibly unquoted) search term
      setHighlighted(query);
      setSearchIdx(0);
      setTimeout(() => scrollToHighlight(first.occ), 200);
    } else {
      setHighlighted(null);
    }
  }

  function scrollToHighlight(occurrence = 0) {
    const el = contentRef.current;
    if (!el) return;
    const marks = el.querySelectorAll('.search-highlight');
    const m = marks[occurrence] as HTMLElement | undefined;
    if (m) {
      try {
        m.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } catch {
        m.scrollIntoView();
      }
      m.style.outline = '3px solid rgba(50,100,255,0.14)';
      setTimeout(() => {
        if (m) m.style.outline = '';
      }, 1200);
      return;
    }

    // Fallback: if marks are not present (sanitization or markup changed),
    // locate the nth occurrence of the highlighted query in the text nodes
    // and scroll the containing node into view.
    const hlQuery = (highlighted || '').trim();
    if (!hlQuery) return;
    try {
      const re = new RegExp(escapeRegExp(hlQuery), 'gi');
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null as any);
      let node: Node | null = walker.nextNode();
      let count = 0;
      while (node) {
        const txt = (node.nodeValue || '');
        let m2: RegExpExecArray | null;
        while ((m2 = re.exec(txt)) !== null) {
          if (count === occurrence) {
            // create a range around this match
            const range = document.createRange();
            range.setStart(node, m2.index);
            range.setEnd(node, m2.index + m2[0].length);
            const parent = range.startContainer.parentElement || (range.startContainer as any).parentNode as HTMLElement | null;
            if (parent) {
              try { parent.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch { parent.scrollIntoView(); }
              parent.style.outline = '3px solid rgba(50,100,255,0.14)';
              setTimeout(() => { if (parent) parent.style.outline = ''; }, 1200);
            }
            range.detach?.();
            return;
          }
          count++;
          if (re.lastIndex === m2.index) re.lastIndex++;
        }
        node = walker.nextNode();
      }
    } catch {
      // ignore fallback errors
    }
  }

  useEffect(() => {
    if (!searchResults.length) return;
    const r = searchResults[Math.min(searchIdx, searchResults.length - 1)];
    if (r) {
      setChapterIdx(r.idx);
      setHighlighted(searchQuery.trim() || null);
      setTimeout(() => scrollToHighlight(r.occ), 200);
    }
  }, [searchIdx, searchResults]);



  // When a click requests navigation to an occurrence we may need to wait
  // until the rendered HTML has been updated and highlights exist. Poll a
  // short while and then perform the scroll; this avoids race conditions
  // where scroll is attempted before marks are present in the DOM.
  useEffect(() => {
    if (pendingScroll === null) return;
    const el = contentRef.current;
    if (!el) return;
    const tryScroll = () => {
      // only attempt when the displayed chapter matches the pending target
      if (chapterIdx !== pendingScroll.idx) return false;
      const marks = el.querySelectorAll('.search-highlight');
      if (marks.length > pendingScroll.occ) {
        scrollToHighlight(pendingScroll.occ);
        setPendingScroll(null);
        return true;
      }
      return false;
    };
    if (tryScroll()) return;
    const interval = setInterval(() => {
      if (tryScroll()) clearInterval(interval);
    }, 150);
    const timeout = setTimeout(() => {
      clearInterval(interval);
      // final attempt only if chapter matches
      if (chapterIdx === (pendingScroll as { idx: number; occ: number }).idx) {
        scrollToHighlight((pendingScroll as { idx: number; occ: number }).occ);
      }
      setPendingScroll(null);
    }, 1200);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pendingScroll, chapterIdx, highlighted]);

  const currentHtml = getChapterHtml(chapterIdx);
  // Avoid re-running expensive DOMParser work on every render when nothing
  // relevant changed. Pipeline the transforms so each step only re-computes
  // when its dependencies change.
  const highlightedHtml = useMemo(
    () => getHighlightedHtml(currentHtml, highlighted),
    [currentHtml, highlighted]
  );
  const headingTransformedHtml = useMemo(
    () => transformChapterHeading(highlightedHtml),
    [highlightedHtml]
  );
  const htmlWithParagraphIds = useMemo(
    () => addParagraphIds(headingTransformedHtml, chapterIdx + 1),
    [headingTransformedHtml, chapterIdx]
  );
  const displayedHtml = useMemo(
    () => applyDropcap(htmlWithParagraphIds, lang, chapterIdx, toc),
    [htmlWithParagraphIds, lang, chapterIdx, toc]
  );

  // If URL has a paragraph hash, try to scroll it into view
  useEffect(() => {
    const hash = (window.location.hash || '').replace(/^#/, '');
    if (!hash) return;
    
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryScroll = () => {
      const el = document.getElementById(hash);
      if (el) {
        // Element found, scroll to it
        setTimeout(() => {
          try {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } catch {
            // Fallback: calculate position and scroll
            const rect = el.getBoundingClientRect();
            const scrollTop = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
            window.scrollTo({ top: scrollTop, behavior: 'smooth' });
          }
        }, 100);
      } else if (attempts < maxAttempts) {
        // Element not found yet, retry
        attempts++;
        setTimeout(tryScroll, 100);
      }
    };
    
    // Start trying after initial render
    requestAnimationFrame(() => {
      setTimeout(tryScroll, 200);
    });
  }, [chapterIdx, displayedHtml]);

  // Derive a readable book title from language mapping/folder name.
  // This uses BOOK_TITLE_OVERRIDES (e.g. Chinese) when available.
  const displayTitle = getBookTitleFromFolder(lang);
  const contentsLabel = lang === CHINESE_FOLDER ? '目录' : 'Contents';
  const tableOfContentsLabel = lang === CHINESE_FOLDER ? '目录' : 'Table of contents';
  const noContentsLabel = lang === CHINESE_FOLDER ? '暂无目录' : 'No contents';
  const noContentsAvailableLabel = lang === CHINESE_FOLDER ? '暂无目录' : 'No contents available';
  const isRtl = (lang || '').toLowerCase().includes('alsra') || lang === FARSI_FOLDER;

  const languageMenuFolders = useMemo(() => {
    const englishFolder = 'The Great Controversy - Ellen G. White 2';
    const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

    const sortedRest = LANGUAGE_FOLDERS
      .filter((f) => f !== englishFolder)
      .sort((a, b) => {
        const aLabel = LANGUAGE_NAMES[a] || LANGUAGE_URL_NAMES[a] || a;
        const bLabel = LANGUAGE_NAMES[b] || LANGUAGE_URL_NAMES[b] || b;
        return collator.compare(aLabel, bLabel);
      });

    return LANGUAGE_FOLDERS.includes(englishFolder)
      ? [englishFolder, ...sortedRest]
      : sortedRest;
  }, []);

  const wrapperStyle: React.CSSProperties = {
    width: isDesktop ? `${pageWidth}px` : '100%',
    fontSize: `${textSize}px`,
    position: 'relative',
  };
  const isCurrentBookmarked =
    !showOpeningToc &&
    !!bookmark &&
    bookmark.lang === lang &&
    bookmark.chapterIdx === chapterIdx;

  const handleBookmark = () => {
    if (showOpeningToc && bookmark) {
      if (bookmark.lang !== lang) {
        pendingChapterIdxRef.current = bookmark.chapterIdx;
        pendingChapterNumberRef.current = null;
        setLang(bookmark.lang);
      } else {
        setChapterIdx(bookmark.chapterIdx);
      }
      setShowOpeningToc(false);
      return;
    }

    if (isCurrentBookmarked) {
      localStorage.removeItem('reader-bookmark');
      setBookmark(null);
      return;
    }

    const next: ReaderBookmark = { lang, chapterIdx, ts: Date.now() };
    localStorage.setItem('reader-bookmark', JSON.stringify(next));
    setBookmark(next);
  };

  return (
    <div className="reader-root">
      {/* Language title removed — header icons now indicate language */}
      <header className="reader-header-bar">
        <div className="reader-header-bar-inner" style={{ width: isDesktop ? `${pageWidth}px` : '100%' }}>
          <div className="reader-header-controls">
            {/* Localized book title on the left */}
            <div
              className="reader-header-title"
              style={{ fontWeight: 600 }}
              role="button"
              tabIndex={0}
              onClick={() => {
                setShowOpeningToc(true);
                try {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch {
                  window.scrollTo(0, 0);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setShowOpeningToc(true);
                }
              }}
              aria-label={`Open contents for ${displayTitle}`}
            >
              {displayTitle}
            </div>
            {/* Chapter menu (burger) - leftmost */}
            <button
              className="reader-burger-icon"
              ref={burgerBtnRef}
              onClick={(e) => {
                e.stopPropagation();
                const btn = burgerBtnRef.current;
                const panelW = 360;
                const maxAllowed = Math.max(120, window.innerWidth - 32);
                const w = Math.min(panelW, maxAllowed);
                if (btn) {
                  const r = btn.getBoundingClientRect();
                  // compute left so panel stays fully on-screen, prefer aligning to button left
                  let left = r.left;
                  if (left + w + 16 > window.innerWidth) left = Math.max(12, window.innerWidth - w - 16);
                  if (left < 12) left = 12;
                  const style: React.CSSProperties = {
                    position: 'fixed',
                    top: r.bottom + 8,
                    left,
                    width: w,
                    maxWidth: '92%',
                    zIndex: 9999,
                  };
                  setChaptersPanelStyle(style);
                } else {
                  // fallback: center near top
                  const left = Math.max(12, Math.floor((window.innerWidth - w) / 2));
                  setChaptersPanelStyle({ position: 'fixed', top: 72, left, width: w, zIndex: 9999 });
                }
                setShowChaptersMenu((v) => !v);
              }}
              aria-label={contentsLabel}
            >
              <MdMenu size={28} />
            </button>

            {/* Spacer to push utilities to the right */}
            <div className="reader-right-controls" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Previous chapter button */}
              <button
                className="reader-prev-chapter"
                aria-label="Previous chapter"
                disabled={showOpeningToc || chapterIdx <= 0}
                onClick={() => {
                  if (showOpeningToc) return;
                  if (chapterIdx > 0) setChapterIdx(chapterIdx - 1);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={isRtl ? '9 6 15 12 9 18' : '15 18 9 12 15 6'} />
                </svg>
              </button>

              {/* Next chapter button */}
              <button
                className="reader-next-chapter"
                aria-label="Next chapter"
                disabled={showOpeningToc || chapterIdx >= chapterIds.length - 1}
                onClick={() => {
                  if (showOpeningToc) return;
                  if (chapterIdx < chapterIds.length - 1) setChapterIdx(chapterIdx + 1);
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points={isRtl ? '15 18 9 12 15 6' : '9 6 15 12 9 18'} />
                </svg>
              </button>
              {/* Content actions group */}
              <button
                className="reader-search-icon"
                ref={searchBtnRef}
                onClick={() => {
                  const btn = searchBtnRef.current;
                  if (btn) {
                    const r = btn.getBoundingClientRect();
                    setSearchPanelStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, minWidth: 320 });
                  }
                  setShowSearch(true);
                  setTimeout(() => {
                    const el = document.querySelector('.reader-search-input') as HTMLInputElement | null;
                    el?.focus();
                  }, 120);
                }}
                aria-label="Search"
              >
                <MdSearch size={24} />
              </button>

              <button
                className={`reader-bookmark-btn${isCurrentBookmarked ? ' active' : ''}`}
                aria-label={showOpeningToc && bookmark ? 'Go to bookmark' : isCurrentBookmarked ? 'Remove bookmark' : 'Bookmark this chapter'}
                title={showOpeningToc && bookmark ? 'Go to bookmark' : isCurrentBookmarked ? 'Remove bookmark' : 'Bookmark this chapter'}
                onClick={handleBookmark}
              >
                {isCurrentBookmarked ? <MdBookmark size={18} /> : <MdBookmarkBorder size={18} />}
              </button>

              <button
                className="reader-share-icon"
                ref={shareBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  const btn = shareBtnRef.current;
                  if (btn) {
                    const r = btn.getBoundingClientRect();
                    setSharePanelStyle({ position: 'fixed', top: r.bottom + 8, left: r.left, minWidth: 220 });
                  }
                  setShowShareMenu((v) => !v);
                }}
                aria-label="Share"
              >
                <MdShare size={22} />
              </button>

              {/* Mobile expand (More) menu */}
              <button
                className="reader-more-icon"
                ref={moreBtnRef}
                onClick={(e) => {
                  e.stopPropagation();
                  const btn = moreBtnRef.current;
                  if (btn) {
                    const r = btn.getBoundingClientRect();
                    setMorePanelStyle({ position: 'fixed', top: r.bottom + 8, right: Math.max(12, window.innerWidth - r.right), minWidth: 220 });
                  }
                  setShowMoreMenu((v) => !v);
                }}
                aria-label="More"
              >
                <MdMoreVert size={22} />
              </button>

              <button
                ref={langBtnRef}
                className="reader-lang-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setLangPanelStyle(getAnchoredPanelStyle(langBtnRef.current, 260));
                  setShowLangMenu((v) => !v);
                }}
                aria-label="Language"
              >
                <MdTranslate size={26} />
              </button>

              {/* Appearance controls group */}
              <div className="reader-text-size-controls" style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                <button
                  className="reader-text-size-btn"
                  aria-label="Decrease text size"
                  onClick={() => {
                    setTextSize((s) => {
                      const next = Math.max(12, s - 1);
                      localStorage.setItem('reader-text-size', String(next));
                      return next;
                    });
                  }}
                >
                  A −
                </button>
                <button
                  className="reader-text-size-btn"
                  aria-label="Increase text size"
                  onClick={() => {
                    setTextSize((s) => {
                      const next = Math.min(36, s + 1);
                      localStorage.setItem('reader-text-size', String(next));
                      return next;
                    });
                  }}
                >
                  A +
                </button>
              </div>

              <button
                className="reader-darkmode-toggle"
                onClick={() => setIsDark((d) => !d)}
                aria-label="Toggle dark mode"
              >
                {isDark ? <MdDarkMode size={22} /> : <MdLightMode size={22} />}
              </button>
              {isDesktop && (
                <>
                  <input
                    className="reader-width-slider"
                    type="range"
                    min={DESKTOP_WIDTH_MIN}
                    max={desktopWidthLimit}
                    value={pageWidth}
                    onChange={(e) => setPageWidth(Number(e.target.value))}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {showShareMenu && (
        <div
          ref={shareMenuRef}
          className="reader-share-dropdown"
          style={sharePanelStyle || undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => handleShareApp('facebook')} aria-label="Share on Facebook">
            <FaFacebookF size={16} />
            <span>Facebook</span>
          </button>
          <button onClick={() => handleShareApp('twitter')} aria-label="Share on X (Twitter)">
            <FaXTwitter size={16} />
            <span>X (Twitter)</span>
          </button>
          <button onClick={() => handleShareApp('whatsapp')} aria-label="Share on WhatsApp">
            <FaWhatsapp size={18} />
            <span>WhatsApp</span>
          </button>
          <button onClick={() => handleShareApp('email')} aria-label="Share via Email">
            <IoMdMail size={18} />
            <span>Email</span>
          </button>
        </div>
      )}

      {showMoreMenu && (
        <div
          ref={moreMenuRef}
          className="reader-share-dropdown"
          style={morePanelStyle || undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const btn = moreBtnRef.current;
              if (btn) {
                const r = btn.getBoundingClientRect();
                const panelW = 360;
                const maxAllowed = Math.max(120, window.innerWidth - 32);
                const w = Math.min(panelW, maxAllowed);
                let left = r.left;
                if (left + w + 16 > window.innerWidth) left = Math.max(12, window.innerWidth - w - 16);
                if (left < 12) left = 12;
                setChaptersPanelStyle({ position: 'fixed', top: r.bottom + 8, left, width: w, maxWidth: '92%', zIndex: 9999 });
              }
              setShowChaptersMenu(true);
              setShowMoreMenu(false);
            }}
            aria-label={contentsLabel}
          >
            <MdMenu size={20} />
            <span>{contentsLabel}</span>
          </button>
          <button
            onClick={() => {
              setLangPanelStyle(getAnchoredPanelStyle(moreBtnRef.current, 260));
              setShowLangMenu(true);
              setShowMoreMenu(false);
            }}
            aria-label="Language"
          >
            <MdTranslate size={20} />
            <span>Language</span>
          </button>
          <button
            onClick={() => {
              setIsDark((d) => !d);
              setShowMoreMenu(false);
            }}
            aria-label="Toggle dark mode"
          >
            {isDark ? <MdDarkMode size={20} /> : <MdLightMode size={20} />}
            <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button onClick={() => handleShareApp('facebook')} aria-label="Share on Facebook">
            <FaFacebookF size={16} />
            <span>Facebook</span>
          </button>
          <button onClick={() => handleShareApp('twitter')} aria-label="Share on X (Twitter)">
            <FaXTwitter size={16} />
            <span>X (Twitter)</span>
          </button>
          <button onClick={() => handleShareApp('whatsapp')} aria-label="Share on WhatsApp">
            <FaWhatsapp size={18} />
            <span>WhatsApp</span>
          </button>
          <button onClick={() => handleShareApp('email')} aria-label="Share via Email">
            <IoMdMail size={18} />
            <span>Email</span>
          </button>
        </div>
      )}

      {showChaptersMenu && (
        <div
          ref={chaptersMenuRef}
          className="reader-chapters-panel"
          style={chaptersPanelStyle || { position: 'fixed', top: 72, left: 16, minWidth: 280 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="reader-modal-header">
            <strong>{contentsLabel}</strong>
            <button onClick={() => setShowChaptersMenu(false)}>✕</button>
          </div>
          <ul className="reader-toc-list">
            {toc.length === 0 && <li className="reader-toc-empty">{noContentsLabel}</li>}
            {toc.map((t, i) => {
              const chapterNum = getChapterNumber(t.title);
              const titleOnly = chapterNum ? stripChapterPrefix(t.title) : t.title;
              return (
                <li key={t.href}>
                  <button
                    className={i === chapterIdx ? 'active' : ''}
                    onClick={() => {
                      setChapterIdx(i);
                      setShowChaptersMenu(false);
                    }}
                  >
                    {chapterNum && <span className="reader-toc-num">Chapter {chapterNum}</span>}
                    <span className="reader-toc-title">{titleOnly}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {showOpeningToc ? (
        <main className="reader-main">
          <div className="reader-wrapper" style={wrapperStyle}>
            {loading ? (
              <div>Loading…</div>
            ) : (
              <section className="reader-opening-toc-inline" aria-label={tableOfContentsLabel}>
                <div className="reader-opening-toc-inline-header">
                  <div className="reader-opening-toc-inline-titles">
                    <h1 className="reader-opening-title">{displayTitle}</h1>
                    <div className="reader-opening-subtitle">{contentsLabel}</div>
                  </div>
                  <div className="reader-opening-toc-inline-actions">
                    <button
                      className="reader-opening-continue"
                      onClick={() => {
                        setShowOpeningToc(false);
                        try {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        } catch {
                          window.scrollTo(0, 0);
                        }
                      }}
                      aria-label="Continue reading"
                    >
                      Continue
                    </button>
                  </div>
                </div>

                <ul className="reader-toc-list reader-opening-toc-list">
                  {toc.length === 0 && <li className="reader-toc-empty">{noContentsAvailableLabel}</li>}
                  {toc.map((t, i) => {
                    const chapterNum = getChapterNumber(t.title);
                    const titleOnly = chapterNum ? stripChapterPrefix(t.title) : t.title;
                    const chapterLabel = LANGUAGE_CHAPTER_LABELS[lang] || 'Chapter';
                    return (
                      <li key={t.href}>
                        <button
                          className={i === chapterIdx ? 'active' : ''}
                          onClick={() => {
                            setChapterIdx(i);
                            setShowOpeningToc(false);
                            try {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            } catch {
                              window.scrollTo(0, 0);
                            }
                          }}
                        >
                          {chapterNum && <span className="reader-toc-num">{chapterLabel} {chapterNum}</span>}
                          <span className="reader-toc-title">{titleOnly}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            <footer className="reader-footer">
              <div className="reader-footer-inner">
                {COPYRIGHTS[lang] || `© ${getBookTitleFromFolder(lang) || LANGUAGE_NAMES[lang] || lang}`}
              </div>
            </footer>
          </div>
        </main>
      ) : (
        <BookContent
          loading={loading}
          isDesktop={isDesktop}
          pageWidth={pageWidth}
          textSize={textSize}
          displayedHtml={displayedHtml}
          contentRef={contentRef}
          copyrightText={(COPYRIGHTS[lang] || `© ${getBookTitleFromFolder(lang) || LANGUAGE_NAMES[lang] || lang}`)}
          lang={lang}
          chapterIdx={chapterIdx}
          chapterTitle={chapterTitle}
          audioMinimized={audioMinimized}
          setAudioMinimized={setAudioMinimized}
          onNextChapter={handleNextChapter}
          onPrevChapter={handlePrevChapter}
        />
      )}

      {showSearch && (
        <div className="reader-search-modal" onClick={() => setShowSearch(false)}>
          <div className="reader-search-card" onClick={(e) => e.stopPropagation()}>
            <div className="reader-search-bar">
              <input
                className="reader-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') runSearch();
                }}
                placeholder="Search in this language"
              />
              <button className="reader-search-close" onClick={() => setShowSearch(false)}>✕</button>
            </div>
            <div className="reader-search-results">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => setSearchIdx((i) => Math.max(0, i - 1))}>Prev</button>
                <div style={{ minWidth: 80, textAlign: 'center' }}>{searchResults.length ? `${searchIdx + 1} / ${searchResults.length}` : '0 / 0'}</div>
                <button onClick={() => setSearchIdx((i) => Math.min((searchResults.length - 1) || 0, i + 1))}>Next</button>
                <button onClick={() => runSearch()}>Search</button>
              </div>
              {/* Render simple snippets for results */}
              {searchResults.length === 0 && <div className="reader-search-noresults">No results</div>}
              {searchResults.map((r, i) => {
                const text = getChapterText(r.idx);
                let displayQ = (searchQuery || '').trim();
                if ((displayQ.startsWith('"') && displayQ.endsWith('"')) || (displayQ.startsWith("'") && displayQ.endsWith("'"))) {
                  displayQ = displayQ.slice(1, -1).trim();
                }
                const idx = (() => {
                  let found = 0;
                  const re = new RegExp(escapeRegExp(displayQ), 'gi');
                  let m: RegExpExecArray | null;
                  while ((m = re.exec(text)) !== null) {
                    if (found === r.occ) return m.index;
                    found++;
                    if (re.lastIndex === m.index) re.lastIndex++;
                  }
                  return -1;
                })();
                const snippet = idx >= 0 ? text.substr(Math.max(0, idx - 40), Math.min(160, text.length - idx + 40)) : text.substr(0, 160);
                return (
                  <button
                    key={`${r.idx}-${r.occ}-${i}`}
                    className="reader-search-result"
                    onClick={() => {
                        // close search modal so the book content is visible,
                        // then navigate to the chapter and request a scroll to the exact occurrence
                        setShowSearch(false);
                        setChapterIdx(r.idx);
                        setSearchIdx(i);
                        // ensure highlights are enabled for the target chapter
                        setHighlighted(displayQ || null);
                        // defer actual scrolling until the rendered HTML contains the highlights
                        setPendingScroll({ idx: r.idx, occ: r.occ });
                      }}
                  >
                    {/* Chapter label: show the TOC title when available, fallback to Chapter N */}
                    <div className="reader-search-chapter">
                      {toc && toc[r.idx] && toc[r.idx].title ? toc[r.idx].title : `Chapter ${r.idx + 1}`}
                    </div>
                    <div style={{ fontSize: '0.95rem', color: 'inherit' }} dangerouslySetInnerHTML={{ __html: snippet.replace(new RegExp(escapeRegExp(displayQ), 'gi'), (m) => `<mark class=\"search-highlight\">${m}</mark>`) }} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showLangMenu && (
        <div
          ref={langMenuRef}
          className="reader-lang-panel"
          style={langPanelStyle || undefined}
          onClick={(e) => e.stopPropagation()}
        >
          <ul>
            {languageMenuFolders.map((f) => (
              <li key={f}>
                <button
                  disabled={f === lang}
                  onClick={() => {
                    setLang(f);
                    setChapterIdx(0);
                    setShowLangMenu(false);
                  }}
                >
                  {LANGUAGE_NAMES[f] || f}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Text selection share popup */}
      {showSharePopup && (
        <div
          ref={sharePopupRef}
          className="reader-share-popup"
          style={(() => {
            // Clamp popup position to viewport
            const width = 260; // estimated popup width
            const margin = 8;
            let left = sharePopupPos.left;
            let top = sharePopupPos.top;
            if (typeof window !== 'undefined') {
              const maxLeft = window.innerWidth - width / 2 - margin;
              const minLeft = width / 2 + margin;
              if (left > maxLeft) left = maxLeft;
              if (left < minLeft) left = minLeft;
              // Clamp top if needed (optional, for very small screens)
              const minTop = margin;
              const maxTop = window.innerHeight - 60;
              if (top < minTop) top = minTop;
              if (top > maxTop) top = maxTop;
            }
            return {
              position: 'fixed',
                  top: `${top}px`,
                  left: `${left}px`,
                  transform: 'translateX(-50%)',
                  zIndex: 10000,
                  background: isDark ? '#23243a' : '#fff',
                  color: isDark ? '#ffe066' : '#23235a',
                  border: '1.5px solid #e0e0e0',
                  borderRadius: 8,
                  padding: '6px'
                };
          })()}
          onMouseDown={e => { restoreSelection(); e.stopPropagation(); e.preventDefault(); }}
          onTouchStart={e => { restoreSelection(); e.stopPropagation(); e.preventDefault(); }}
          onMouseEnter={restoreSelection}
        >
          <div className="reader-share-popup-content">
            <button 
              onClick={handleCopy}
              aria-label="Copy text"
              title="Copy"
            >
              <MdContentCopy size={18} />
            </button>
            {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
              <button 
                onClick={() => handleShare('native')}
                aria-label="Share"
                title="Share"
              >
                <MdShare size={18} />
              </button>
            )}
            <button 
              onClick={() => handleShare('facebook')}
              aria-label="Share on Facebook"
              title="Facebook"
            >
              <FaFacebookF size={16} />
            </button>
            <button 
              onClick={() => handleShare('twitter')}
              aria-label="Share on X/Twitter"
              title="X (Twitter)"
            >
              <FaXTwitter size={16} />
            </button>
            <button 
              onClick={() => handleShare('whatsapp')}
              aria-label="Share on WhatsApp"
              title="WhatsApp"
            >
              <FaWhatsapp size={18} />
            </button>
            <button 
              onClick={() => handleShare('email')}
              aria-label="Share via Email"
              title="Email"
            >
              <IoMdMail size={18} />
            </button>
            <button 
              onClick={() => {
                setShowSharePopup(false);
                // restore iOS touch callout when popup closed
                try {
                  if (contentRef.current && (contentRef.current as any).style) {
                    (contentRef.current as any).style.webkitTouchCallout = '';
                  }
                } catch {}
                window.getSelection()?.removeAllRanges();
              }}
              aria-label="Close"
              title="Close"
              className="reader-share-close"
            >
              <MdClose size={16} />
            </button>
          </div>
        </div>
      )}
      {showCopyToast && (
        <div
          className="reader-share-feedback reader-share-feedback-near"
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            top: `${copyToastPos.top}px`,
            left: `${copyToastPos.left}px`,
            transform: 'translateX(-50%)',
            zIndex: 10001,
          }}
        >
          Copied
        </div>
      )}
    </div>
  );
    }


