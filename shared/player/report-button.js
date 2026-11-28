export function reportPayload(provider = globalThis.soundnovelReport) {
  if (typeof provider !== 'function') return {scene: null, text: null};
  const result = provider();
  return {scene: result?.scene ?? null, text: result?.text ?? null};
}

export function wireReportButton(button, {onReport} = {}) {
  const handler = () => {
    const payload = reportPayload();
    if (onReport) onReport(payload);
    else globalThis.dispatchEvent?.(new CustomEvent('soundnovel-report', {detail: payload}));
  };
  button.addEventListener('click', handler);
  return () => button.removeEventListener('click', handler);
}
