import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

// Loads `path` and exposes { data, loading, error, reload }. Ignores stale responses when path changes.
export function useFetch(path, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!enabled || !path) return;
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(path);
      if (id === seq.current) setData(res);
    } catch (e) {
      if (id === seq.current) setError(e.message);
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [path, enabled]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load, setData };
}
