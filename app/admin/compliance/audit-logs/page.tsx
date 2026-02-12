'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Download, Filter, RefreshCw, AlertTriangle } from 'lucide-react';
import { trpc } from '@/app/_trpc/client';

export default function AuditLogsPage() {
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [days, setDays] = useState(30);
  const [actionType, setActionType] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  
  const logsQuery = trpc.adminAuditLogs.getLogs.useQuery({
    limit,
    offset,
    days,
    actionType,
    search: search || undefined,
  });

  const summaryQuery = trpc.adminAuditLogs.getAuditSummary.useQuery({ days });

  const exportMutation = trpc.adminAuditLogs.exportLogs.useMutation();

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const result = await exportMutation.mutateAsync({ days, format });
      
      const blob = new Blob([result.data], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const getSeverityColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'low':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'high':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light tracking-tight">Audit Logs</h1>
          <p className="text-gray-400 mt-1">Track all admin actions for compliance and security</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => logsQuery.refetch()}
            disabled={logsQuery.isLoading}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Select value="" onValueChange={(v) => v && handleExport(v as any)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Export" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">Export CSV</SelectItem>
              <SelectItem value="json">Export JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {}
      {summaryQuery.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light">{summaryQuery.data.totalActions}</div>
              <p className="text-xs text-gray-400 mt-1">Last {days} days</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light">{summaryQuery.data.topAdmins.length}</div>
              <p className="text-xs text-gray-400 mt-1">This period</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Risk Flags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light text-red-400">{summaryQuery.data.riskFlags.length}</div>
              <p className="text-xs text-gray-400 mt-1">Detected</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Action</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-light capitalize">
                {
                  Object.entries(summaryQuery.data.actionsByType).sort(
                    (a, b) => b[1] - a[1]
                  )[0]?.[0]
                }
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {Object.entries(summaryQuery.data.actionsByType).sort(
                  (a, b) => b[1] - a[1]
                )[0]?.[1] || 0}{' '}
                actions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {}
      {summaryQuery.data && summaryQuery.data.riskFlags.length > 0 && (
        <Card className="bg-red-500/10 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-base font-light flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {summaryQuery.data.riskFlags.map((flag) => (
                <div key={flag.flag} className="flex justify-between items-center p-2 bg-red-500/5 rounded border border-red-500/30">
                  <span className="text-sm">{flag.flag}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-red-400 border-red-400">
                      {flag.count} occurrences
                    </Badge>
                    <Badge className={getSeverityColor(flag.severity)}>
                      {flag.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {}
      {summaryQuery.data && summaryQuery.data.topAdmins.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-light">Top Admin Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {summaryQuery.data.topAdmins.map((admin, idx) => (
                <div key={admin.userId} className="flex justify-between items-center p-3 border border-gray-800 rounded-lg bg-gray-800/30">
                  <div>
                    <Badge className="bg-purple-600 mb-2">#{idx + 1}</Badge>
                    <div className="font-medium text-sm">{admin.email}</div>
                    <div className="text-xs text-gray-400">Last action: {new Date(admin.lastAction).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium">{admin.actionCount}</div>
                    <div className="text-xs text-gray-400">actions</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {}
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-900 border-gray-800"
          />
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-lg font-light">Activity Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {logsQuery.isLoading ? (
            <div className="text-center py-8 text-gray-400">Loading audit logs...</div>
          ) : logsQuery.data?.logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No audit logs found</div>
          ) : (
            <div className="space-y-2">
              {logsQuery.data?.logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-800 rounded-lg p-3 hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-purple-400 border-purple-400">
                          {log.actionType}
                        </Badge>
                        <span className="text-sm font-medium">{log.action}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">
                        By: <span className="text-purple-400">{log.performedByName || log.performedBy?.slice(0, 8) || 'Unknown'}</span>
                        {log.performedByRole && (
                          <>
                            {' '}
                            • <span className="capitalize">{log.performedByRole}</span>
                          </>
                        )}
                        {log.listingId && (
                          <>
                            {' '}
                            • Listing: <span className="text-blue-400">{log.listingId.slice(0, 8)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-xs text-gray-400">
                      {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {}
          {logsQuery.data && logsQuery.data.hasMore && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={() => setOffset(offset + limit)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}