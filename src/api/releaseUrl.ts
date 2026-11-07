export function acceptedDownloadUrl(value: string): boolean {
  const prefix = 'https://github.com/YonierProgramas/CyberSOC/releases/download/';
  try {
    const url = new URL(value);
    if (!value.startsWith(prefix) || value !== url.origin + url.pathname) return false;
    const parts = url.pathname.slice(new URL(prefix).pathname.length).split('/');
    // Dos segmentos canónicos: tag y archivo. O(L) en la longitud de la URL.
    // No aceptar normalización de ../, separadores codificados ni doble encoding.
    return (
      parts.length === 2 &&
      parts.every((part) => {
        const decoded = decodeURIComponent(part);
        return (
          decoded.length > 0 &&
          decoded !== '.' &&
          decoded !== '..' &&
          !/[\\/\u0000-\u0020\u007f-\u009f%]/.test(decoded)
        );
      })
    );
  } catch {
    return false;
  }
}
