import { autoReleaseExpiredHolds, autoEscalateOldDisputes } from './disputeResolutionService';
import { processAutomaticPayouts } from './automaticPayoutService';

/**
 * Initialize all scheduled tasks for payment flow automation
 * This should be called on server startup
 */
export function initializeScheduledTasks(): void {
  // Run every 6 hours: Release expired payment holds
  scheduleTask('releaseExpiredHolds', 6 * 60 * 60 * 1000, async () => {
    try {
      console.log('Starting scheduled task: Release expired payment holds');
      const result = await autoReleaseExpiredHolds(30);
      console.log(
        `Completed: Released ${result.released} holds, Failed: ${result.failed}`
      );
    } catch (err: any) {
      console.error('Error in release expired holds task:', err);
    }
  });

  // Run every 4 hours: Process automatic payouts
  scheduleTask('processAutomaticPayouts', 4 * 60 * 60 * 1000, async () => {
    try {
      console.log('Starting scheduled task: Process automatic payouts');
      const result = await processAutomaticPayouts();
      console.log(
        `Completed: Processed ${result.processed} payouts, Total: ₦${(result.totalAmount / 100).toFixed(2)}`
      );
    } catch (err: any) {
      console.error('Error in process payouts task:', err);
    }
  });

  // Run every 24 hours: Escalate old disputes
  scheduleTask('escalateOldDisputes', 24 * 60 * 60 * 1000, async () => {
    try {
      console.log('Starting scheduled task: Escalate old disputes');
      const result = await autoEscalateOldDisputes();
      console.log(
        `Completed: Escalated ${result.escalated} disputes, Failed: ${result.failed}`
      );
    } catch (err: any) {
      console.error('Error in escalate disputes task:', err);
    }
  });

  console.log('Scheduled payment flow automation tasks initialized');
}

// Store active intervals for cleanup
const activeIntervals: Map<string, NodeJS.Timeout> = new Map();

/**
 * Schedule a task to run at regular intervals
 */
function scheduleTask(
  taskName: string,
  intervalMs: number,
  taskFunction: () => Promise<void>
): void {
  // Run immediately on first schedule
  taskFunction().catch((err) => {
    console.error(`Error in initial run of ${taskName}:`, err);
  });

  // Schedule subsequent runs
  const interval = setInterval(
    () => {
      taskFunction().catch((err) => {
        console.error(`Error in scheduled task ${taskName}:`, err);
      });
    },
    intervalMs
  );

  activeIntervals.set(taskName, interval);
  console.log(`Task scheduled: ${taskName} (every ${intervalMs / 1000 / 60} minutes)`);
}

/**
 * Cancel a scheduled task
 */
export function cancelScheduledTask(taskName: string): void {
  const interval = activeIntervals.get(taskName);
  if (interval) {
    clearInterval(interval);
    activeIntervals.delete(taskName);
    console.log(`Task cancelled: ${taskName}`);
  }
}

/**
 * Cancel all scheduled tasks
 */
export function cancelAllScheduledTasks(): void {
  activeIntervals.forEach((interval, taskName) => {
    clearInterval(interval);
    console.log(`Task cancelled: ${taskName}`);
  });
  activeIntervals.clear();
  console.log('All scheduled tasks cancelled');
}

/**
 * Get status of scheduled tasks
 */
export function getScheduledTasksStatus(): {
  tasks: Array<{
    name: string;
    active: boolean;
    description: string;
  }>;
  totalActive: number;
} {
  const taskDescriptions: Record<string, string> = {
    releaseExpiredHolds: 'Release expired payment holds (every 6 hours)',
    processAutomaticPayouts: 'Process automatic seller payouts (every 4 hours)',
    escalateOldDisputes: 'Escalate unresolved disputes (every 24 hours)',
  };

  const tasks = Object.entries(taskDescriptions).map(([taskName, description]) => ({
    name: taskName,
    active: activeIntervals.has(taskName),
    description,
  }));

  return {
    tasks,
    totalActive: activeIntervals.size,
  };
}