import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

// Shared save/apply behaviour. `update(id, patch)` lets the caller patch its own list optimistically.
export function useOpportunityActions(update, reload) {
  const save = useCallback(async (opp) => {
    update(opp.id, { saved: !opp.saved });
    try {
      const { saved } = await api.post(`/opportunities/${opp.id}/save`);
      toast.success(saved ? 'Saved to your list' : 'Removed from saved');
    } catch (e) {
      update(opp.id, { saved: opp.saved });
      toast.error(e.message);
    }
  }, [update]);

  const apply = useCallback(async (opp, coverNote) => {
    try {
      await api.post('/applications', { opportunityId: opp.id, coverNote });
      toast.success(`Applied to ${opp.title}`);
      update(opp.id, { applicationStatus: 'APPLIED' });
      reload?.();
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    }
  }, [update, reload]);

  return { save, apply };
}
