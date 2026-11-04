import { PortalError } from './fault';
export type Fetcher = typeof fetch;
export type HttpResult = { ok: boolean; status: number; data: unknown; retryAfterMs: number };
async function boundedJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  if (!response.headers.get('content-type')?.includes('application/json')) {
    if (response.ok) throw new PortalError('BAD_RESPONSE');
    await response.body?.cancel();
    return null;
  }
  const reader = response.body?.getReader();
  if (!reader) throw new PortalError('BAD_RESPONSE');
  let bytes = 0;
  let text = '';
  const decoder = new TextDecoder();
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 524288) throw new PortalError('BAD_RESPONSE');
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode()) as unknown;
  } catch {
    await reader.cancel().catch(() => undefined);
    throw new PortalError('BAD_RESPONSE');
  } finally {
    reader.releaseLock();
  }
}
export async function requestJson(
  fetcher: Fetcher,
  url: string,
  init: RequestInit,
  signal: AbortSignal,
  timeoutMs = 12000,
): Promise<HttpResult> {
  if (signal.aborted) throw new PortalError('SESSION_ENDED');
  const controller = new AbortController();
  let rejectAbort: (error: PortalError) => void = () => undefined;
  const interrupted = new Promise<never>((_resolve, reject) => {
    rejectAbort = reject;
  });
  const abort = () => {
    controller.abort();
    rejectAbort(new PortalError('SESSION_ENDED'));
  };
  signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(() => {
    controller.abort();
    rejectAbort(new PortalError('TIMEOUT'));
  }, timeoutMs);
  try {
    const operation = (async () => {
      const response = await fetcher(url, {
        ...init,
        signal: controller.signal,
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
        cache: 'no-store',
      });
      const seconds = Number(response.headers.get('retry-after'));
      return {
        ok: response.ok,
        status: response.status,
        data: await boundedJson(response),
        retryAfterMs: Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0,
      };
    })();
    return await Promise.race([operation, interrupted]);
  } catch (error) {
    if (error instanceof PortalError) throw error;
    if (signal.aborted) throw new PortalError('SESSION_ENDED');
    throw new PortalError('NETWORK');
  } finally {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
  }
}
export async function abortableDelay(ms: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) throw new PortalError('SESSION_ENDED');
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      reject(new PortalError('SESSION_ENDED'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal.addEventListener('abort', abort, { once: true });
  });
}
