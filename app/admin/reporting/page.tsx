'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Calendar, Download, FileText, Plus, Trash2, Clock, Mail } from 'lucide-react';
import { trpc } from '@/app/_trpc/client';

export default function ReportingPage() {
  const [activeTab, setActiveTab] = useState('generate');
  const [reportType, setReportType] = useState('sales_summary');
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportFormat, setExportFormat] = useState('pdf');

  
  const templatesQuery = trpc.adminReportGenerator.getReportTemplates.useQuery();
  const scheduledQuery = trpc.adminReportGenerator.getScheduledReports.useQuery();

  
  const generateMutation = trpc.adminReportGenerator.generateReport.useMutation();
  const createScheduledMutation = trpc.adminReportGenerator.createScheduledReport.useMutation();
  const deleteMutation = trpc.adminReportGenerator.deleteScheduledReport.useMutation();

  const handleGenerateReport = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        type: reportType as any,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        format: exportFormat as any,
      });

      
      const blob = new Blob([JSON.stringify(result.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName;
      a.click();
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-3xl font-light tracking-tight">Report Generator</h1>
        <p className="text-gray-400 mt-1">Generate and schedule comprehensive business reports</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-black border border-gray-800">
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled Reports</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {}
        <TabsContent value="generate" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-light">Create On-Demand Report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {}
              <div className="space-y-2">
                <Label htmlFor="report-type">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="report-type" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_summary">Sales Summary</SelectItem>
                    <SelectItem value="seller_performance">Seller Performance</SelectItem>
                    <SelectItem value="payment_summary">Payment Summary</SelectItem>
                    <SelectItem value="dispute_summary">Dispute Summary</SelectItem>
                    <SelectItem value="user_metrics">User Metrics</SelectItem>
                    <SelectItem value="inventory_report">Inventory Report</SelectItem>
                    <SelectItem value="tax_report">Tax Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
              </div>

              {}
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={exportFormat} onValueChange={setExportFormat}>
                  <SelectTrigger id="format" className="bg-gray-800 border-gray-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {}
              {generateMutation.data && (
                <Card className="bg-gray-800/50 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Report Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {Object.entries(generateMutation.data.summary).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={handleGenerateReport}
                disabled={generateMutation.isPending}
              >
                <Download className="w-4 h-4 mr-2" />
                {generateMutation.isPending ? 'Generating...' : 'Generate & Download Report'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {}
        <TabsContent value="scheduled" className="space-y-6">
          {}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-light flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Create Scheduled Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="e.g., Weekly Sales Summary"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type-sched">Report Type</Label>
                  <Select defaultValue="sales_summary">
                    <SelectTrigger id="report-type-sched" className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales_summary">Sales Summary</SelectItem>
                      <SelectItem value="seller_performance">Seller Performance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="schedule">Schedule</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger id="schedule" className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipients">Recipients (comma-separated emails)</Label>
                <Input
                  id="recipients"
                  placeholder="admin@luxela.com, finance@luxela.com"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Clock className="w-4 h-4 mr-2" />
                Create Scheduled Report
              </Button>
            </CardContent>
          </Card>

          {}
          {scheduledQuery.data && scheduledQuery.data.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-lg font-light">Active Schedules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {scheduledQuery.data.map((report) => (
                  <div key={report.id} className="border border-gray-800 rounded-lg p-4 bg-gray-800/30">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium">{report.name}</div>
                        <div className="text-xs text-gray-400 mt-1 space-y-1">
                          <div>Type: {report.type}</div>
                          <div className="capitalize">Schedule: {report.schedule}</div>
                          <div>Recipients: {report.recipients.length}</div>
                          {report.nextRun && (
                            <div>
                              Next run: {new Date(report.nextRun).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={report.enabled ? 'bg-green-600' : 'bg-gray-600'}>
                          {report.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this scheduled report?
                            </AlertDialogDescription>
                            <div className="flex gap-2 justify-end">
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate({ reportId: report.id })}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </div>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {}
        <TabsContent value="templates" className="space-y-6">
          {templatesQuery.data && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templatesQuery.data.map((template) => (
                <Card key={template.id} className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-base font-light flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-400" />
                      {template.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-400 mb-4">{template.description}</p>
                    <Button
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={() => {
                        setReportType(template.type);
                        setActiveTab('generate');
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}