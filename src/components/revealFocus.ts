function covers(target: HTMLElement, viewport: VisualViewport) {
  const box = target.getBoundingClientRect();
  const slop = 2;
  return (
    box.width > 0 &&
    box.height > 0 &&
    box.left >= viewport.offsetLeft - slop &&
    box.top >= viewport.offsetTop - slop &&
    box.right <= viewport.offsetLeft + viewport.width + slop &&
    box.bottom <= viewport.offsetTop + viewport.height + slop
  );
}

// Con la página ampliada, el navegador acerca la vista al enfocar, pero no la mueve
// si el control ya asoma un poco. Un punto en el origen obliga a recentrar y el
// segundo foco deja el control completo dentro de la zona visible.
export function trackVisualViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return () => undefined;
  const apply = () => {
    const root = document.documentElement;
    if (viewport.scale > 1) {
      root.dataset.scaled = 'true';
      root.style.setProperty('--vv-left', `${viewport.offsetLeft}px`);
      root.style.setProperty('--vv-top', `${viewport.offsetTop}px`);
      root.style.setProperty('--vv-width', `${viewport.width}px`);
      root.style.setProperty('--vv-height', `${viewport.height}px`);
    } else {
      delete root.dataset.scaled;
    }
  };
  apply();
  viewport.addEventListener('resize', apply);
  viewport.addEventListener('scroll', apply);
  return () => {
    viewport.removeEventListener('resize', apply);
    viewport.removeEventListener('scroll', apply);
    delete document.documentElement.dataset.scaled;
  };
}

export function reveal(target: HTMLElement | null) {
  if (!target) return;
  target.focus();
  const viewport = window.visualViewport;
  if (!viewport || viewport.scale <= 1 || covers(target, viewport)) return;
  document.querySelector<HTMLElement>('[data-reveal-anchor]')?.focus();
  target.focus();
}
