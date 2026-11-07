import { PortalError } from './fault';

export type ReadPromise<T> = Promise<T> & { cancel: () => void };
type Entry = { controller: AbortController; promise: Promise<unknown>; readers: number };

export class ReadPool {
  // Invariante: una operación en curso por sesión/recurso; ningún token se guarda.
  // Map.get/set/delete O(1) esperado. Cada lector tiene su cancelación O(1);
  // solo se aborta el transporte cuando ya no quedan lectores. Sin caché de datos.
  private readonly pending = new Map<string, Entry>();

  read<T>(key: string, operation: (signal: AbortSignal) => Promise<T>): ReadPromise<T> {
    let entry = this.pending.get(key);
    if (!entry) {
      const controller = new AbortController();
      entry = {
        controller,
        readers: 0,
        promise: Promise.resolve().then(() => {
          if (controller.signal.aborted) throw new PortalError('SESSION_ENDED');
          return operation(controller.signal);
        }),
      };
      this.pending.set(key, entry);
      const current = entry;
      const remove = () => {
        if (this.pending.get(key) === current) this.pending.delete(key);
      };
      void entry.promise.then(remove, remove);
    }
    const shared = entry;
    shared.readers += 1;
    let finished = false;
    let rejectReader: (error: PortalError) => void = () => undefined;
    const release = () => {
      if (finished) return;
      finished = true;
      shared.readers -= 1;
      // StrictMode vuelve a suscribir en el mismo turno. Un microtask permite
      // reutilizar la operación; una página abandonada no llega al próximo retry.
      queueMicrotask(() => {
        if (!shared.readers && this.pending.get(key) === shared) {
          this.pending.delete(key);
          shared.controller.abort();
        }
      });
    };
    const promise = new Promise<T>((resolve, reject) => {
      rejectReader = reject;
      void shared.promise.then(
        (value) => {
          if (!finished) {
            release();
            resolve(value as T);
          }
        },
        (error: unknown) => {
          if (!finished) {
            release();
            reject(error);
          }
        },
      );
    });
    return Object.assign(promise, {
      cancel() {
        if (!finished) {
          release();
          rejectReader(new PortalError('SESSION_ENDED'));
        }
      },
    });
  }
}
