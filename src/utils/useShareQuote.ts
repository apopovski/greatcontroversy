export function useShareQuote() {
  // share a quote + url (if available). If Web Share API exists, prefer it,
  // otherwise copy to clipboard and show a simple alert.
  return async (text: string, url?: string) => {
    const payload = url ? `${text}\n\n${url}` : text;
    try {
      if (navigator.share) {
        await navigator.share({ text: payload, url });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(payload);
        // small UX: inform the user
        // eslint-disable-next-line no-alert
        alert('Quote and link copied to clipboard');
      } else {
        // fallback: old-school execCommand
        const ta = document.createElement('textarea');
        ta.value = payload;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); /* eslint-disable-line */ } catch {}
        document.body.removeChild(ta);
        // eslint-disable-next-line no-alert
        alert('Quote copied to clipboard');
      }
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert('Unable to share — copied to clipboard instead.');
      try { await navigator.clipboard.writeText(payload); } catch {}
    }
  };
}
