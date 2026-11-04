import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { PortalRuntime } from './runtime';
import { asPortalError, type PortalError } from '../api/fault';
const Context = createContext<PortalRuntime | null>(null);
export function PortalProvider({
  runtime,
  children,
}: {
  runtime: PortalRuntime;
  children: ReactNode;
}) {
  return <Context.Provider value={runtime}>{children}</Context.Provider>;
}
export function usePortal() {
  const runtime = useContext(Context);
  if (!runtime) throw new Error('Falta el contexto del portal.');
  return runtime;
}
export function useSession() {
  const { session } = usePortal();
  return useSyncExternalStore(session.subscribe, session.getSnapshot);
}
export type Resource<T> =
  { status: 'loading' } | { status: 'error'; error: PortalError } | { status: 'ready'; data: T };
export function useResource<T>(load: () => Promise<T>) {
  const { session } = usePortal();
  const epoch = useSession().epoch;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<Resource<T>>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    void load()
      .then((data) => {
        if (active && session.getSnapshot().epoch === epoch) setState({ status: 'ready', data });
      })
      .catch((error) => {
        if (active && session.getSnapshot().epoch === epoch)
          setState({ status: 'error', error: asPortalError(error) });
      });
    return () => {
      active = false;
    };
  }, [load, revision, epoch, session]);
  return {
    state,
    reload: () => {
      setState({ status: 'loading' });
      setRevision((value) => value + 1);
    },
  };
}
export function useAction() {
  const { session } = usePortal();
  const locked = useRef(false);
  const mounted = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<PortalError | null>(null);
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      clearTimeout(cooldownTimer.current);
    };
  }, []);
  async function run(work: () => Promise<void>, changesSession = false) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError(null);
    setMessage('');
    const epoch = session.getSnapshot().epoch;
    try {
      await work();
    } catch (cause) {
      if (mounted.current && (changesSession || epoch === session.getSnapshot().epoch)) {
        const fault = asPortalError(cause);
        setError(fault);
        if (fault.code === 'RATE_LIMITED') {
          setCooldown(true);
          cooldownTimer.current = setTimeout(
            () => {
              cooldownTimer.current = undefined;
              locked.current = false;
              if (mounted.current) setCooldown(false);
            },
            Math.max(1000, fault.retryAfterMs || 60000),
          );
        }
      }
    } finally {
      if (mounted.current) setBusy(false);
      // El límite de frecuencia exige esperar, no dispara una nueva solicitud.
      if (!cooldownTimer.current) locked.current = false;
    }
  }
  return { busy: busy || cooldown, pending: busy, error, message, setMessage, run };
}
