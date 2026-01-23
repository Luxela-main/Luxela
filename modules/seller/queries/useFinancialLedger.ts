import { useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { toastSvc } from '@/services/toast';

export const useFinancialLedger = () => {
  // Get all ledger entries with pagination
  const getLedgerEntries = trpc.finance.getLedgerEntries.useQuery(
    { limit: 50, offset: 0 },
    { staleTime: 1000 * 60 * 5 }
  );

  // Get specific ledger entry details
  const getLedgerEntryDetails = (entryId: string) =>
    trpc.finance.getLedgerEntry.useQuery(
      { entryId },
      { staleTime: 1000 * 60 * 5 }
    );

  // Get ledger summary (total income, expenses, balance)
  const getLedgerSummary = trpc.finance.getLedgerSummary.useQuery(
    {},
    { staleTime: 1000 * 60 * 10 }
  );

  // Export ledger to CSV
  const exportLedger = trpc.finance.exportLedgerCSV.useQuery(
    {},
    { staleTime: 1000 * 60 * 5 }
  );

  return {
    getLedgerEntries,
    getLedgerEntryDetails,
    getLedgerSummary,
    exportLedger,
  };
};