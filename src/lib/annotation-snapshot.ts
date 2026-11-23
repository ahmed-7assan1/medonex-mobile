// Render a content-only snapshot in a same-origin frame without scripts, forms or network.
// The editor itself stays opaque and cannot read the application's local storage.
export async function renderAnnotationPng(data: { html: unknown; css: unknown; width: unknown; height: unknown; dark?: unknown; compact?: unknown; direction?: unknown }): Promise<string> {
  if (typeof data.html !== 'string' || data.html.length > 12_000_000 || typeof data.css !== 'string' || data.css.length > 3_000_000 || typeof data.width !== 'number' || typeof data.height !== 'number' || !Number.isFinite(data.width) || !Number.isFinite(data.height) || data.width < 1 || data.height < 1 || data.width > 4096 || data.height > 12000 || data.width * data.height * 4 > 24_000_000) throw Error('The page is too large for an image. Use PDF instead.');
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-same-origin');
  frame.title = 'Temporary notes image renderer';
  frame.style.cssText = `position:fixed;left:-100000px;top:0;width:${Math.ceil(data.width)}px;height:${Math.ceil(data.height)}px;pointer-events:none;border:0`;
  const loaded = new Promise<void>((resolve, reject) => { const timeout = setTimeout(() => reject(Error('The image renderer took too long to start.')), 20000); frame.onload = () => { clearTimeout(timeout); resolve(); }; frame.onerror = () => { clearTimeout(timeout); reject(Error('The image renderer could not start.')); }; });
  frame.srcdoc = '<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; script-src \'none\'; style-src \'unsafe-inline\'; img-src data: blob:; font-src data:; frame-src about:; form-action \'none\'; base-uri \'none\'"></head><body></body></html>';
  document.body.appendChild(frame);
  try {
    await loaded;
    const doc = frame.contentDocument;
    if (!doc) throw Error('The image renderer is unavailable.');
    doc.documentElement.classList.add('medonex-font-variables');
    doc.body.className = data.compact === true ? 'lecture-mobile' : '';
    doc.documentElement.classList.toggle('dark', data.dark === true);
    doc.documentElement.dataset.theme = data.dark === true ? 'dark' : 'light';
    doc.documentElement.dir = data.direction === 'rtl' ? 'rtl' : 'ltr';
    const style = doc.createElement('style');
    style.textContent = data.css + '\nhtml,body{margin:0!important;padding:0!important;font-family:Arial,sans-serif}body{width:100%}.notes-white-page{width:100%;transform:none!important;zoom:1!important}';
    doc.head.appendChild(style);
    doc.body.innerHTML = data.html;
    await doc.fonts.ready;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(doc.body.firstElementChild as HTMLElement, { scale: 2, useCORS: false, allowTaint: false, backgroundColor: doc.defaultView?.getComputedStyle(doc.body.firstElementChild!).backgroundColor || '#ffffff', logging: false, foreignObjectRendering: true, windowWidth: data.width, windowHeight: data.height });
    const value = canvas.toDataURL('image/png').slice(22);
    if (value.length > 26_666_668) throw Error('The generated image is too large. Use PDF instead.');
    return value;
  } finally { frame.remove(); }
}
