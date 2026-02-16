'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, X, Mail, Settings, CreditCard, Shield } from 'lucide-react';
import { trpc } from '@/app/_trpc/client';

export default function AdvancedSettingsPage() {
  const [activeTab, setActiveTab] = useState('payment');
  const [saving, setSaving] = useState(false);

  
  const paymentQuery = trpc.adminSettings.getPaymentSettings.useQuery();
  const emailQuery = trpc.adminSettings.getEmailTemplateSettings.useQuery();
  const platformQuery = trpc.adminSettings.getPlatformRules.useQuery();

  
  const paymentMutation = trpc.adminSettings.updatePaymentSettings.useMutation();
  const emailMutation = trpc.adminSettings.updateEmailSettings.useMutation();
  const platformMutation = trpc.adminSettings.updatePlatformRules.useMutation();
  const testEmailMutation = trpc.adminSettings.testEmailSettings.useMutation();

  const handleSavePayment = async (data: any) => {
    setSaving(true);
    try {
      await paymentMutation.mutateAsync(data);
      
    } catch (error) {
      console.error('Error saving payment settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {}
      <div>
        <h1 className="text-3xl font-light tracking-tight">Advanced Settings</h1>
        <p className="text-gray-400 mt-1">Configure payment, email, and platform rules</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-black border border-gray-800">
          <TabsTrigger value="payment">Payment</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="platform">Platform Rules</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {}
        <TabsContent value="payment" className="space-y-6">
          {paymentQuery.data && (
            <>
              {}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">Platform Commission</CardTitle>
                  <CardDescription>Set your platform's commission rate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission Rate (%)</Label>
                    <Input
                      id="commission"
                      type="number"
                      defaultValue={paymentQuery.data.commissionRate}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="refund-window">Refund Window (days)</Label>
                    <Input
                      id="refund-window"
                      type="number"
                      defaultValue={paymentQuery.data.refundWindow}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payout-schedule">Auto Payout Schedule</Label>
                    <Select defaultValue={paymentQuery.data.autoPayoutSchedule}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Providers */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">Payment Providers</CardTitle>
                  <CardDescription>Enable/disable payment gateways</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentQuery.data.paymentProviders.map((provider: any) => (
                    <div key={provider.id} className="border border-gray-800 rounded-lg p-4 bg-gray-800/30">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-purple-400" />
                          <div>
                            <div className="font-medium">{provider.name}</div>
                            <div className="text-xs text-gray-400">
                              {provider.fee && `${provider.fee}% + ₦${provider.feeFixed}`}
                            </div>
                          </div>
                        </div>
                        <Badge className={provider.enabled ? 'bg-green-600' : 'bg-gray-600'}>
                          {provider.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Payout Methods */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">Payout Methods</CardTitle>
                  <CardDescription>Configure how sellers receive payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentQuery.data.payoutMethods.map((method: any) => (
                    <div key={method.id} className="border border-gray-800 rounded-lg p-4 bg-gray-800/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Min payout: ₦{method.minPayout} • Processing: {method.processingTime} • Fee: {method.fee}%
                          </div>
                        </div>
                        <Badge className={method.enabled ? 'bg-green-600' : 'bg-gray-600'}>
                          {method.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button className="bg-purple-600 hover:bg-purple-700 w-full" onClick={() => handleSavePayment({})}>
                {saving ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </>
          )}
        </TabsContent>

        {/* Email Tab */}
        <TabsContent value="email" className="space-y-6">
          {emailQuery.data && (
            <>
              {/* SMTP Settings */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">SMTP Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp-server">SMTP Server</Label>
                      <Input
                        id="smtp-server"
                        defaultValue={emailQuery.data.smtp.server}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        defaultValue={emailQuery.data.smtp.port}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      type="email"
                      defaultValue={emailQuery.data.smtp.fromEmail}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tls">Enable TLS</Label>
                    <Switch defaultChecked={emailQuery.data.smtp.enableTLS} />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() =>
                      testEmailMutation.mutate({
                        recipient: emailQuery.data.smtp.fromEmail,
                      })
                    }
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                </CardContent>
              </Card>

              {/* Email Templates */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">Email Templates</CardTitle>
                  <CardDescription>Manage notification email templates</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {emailQuery.data.emailTemplates.map((template: any) => (
                    <div key={template.id} className="border border-gray-800 rounded-lg p-4 bg-gray-800/30">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-gray-400 mt-1">{template.subject}</div>
                          <Badge variant="outline" className="mt-2 text-xs">
                            {template.category}
                          </Badge>
                        </div>
                        <Badge className={template.enabled ? 'bg-green-600' : 'bg-gray-600'}>
                          {template.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" className="mt-3">
                        Edit Template
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Platform Rules Tab */}
        <TabsContent value="platform" className="space-y-6">
          {platformQuery.data && (
            <>
              {/* Listing Rules */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">Listing Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Price</Label>
                      <Input
                        type="number"
                        defaultValue={platformQuery.data.listing.minPrice}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Price</Label>
                      <Input
                        type="number"
                        defaultValue={platformQuery.data.listing.maxPrice}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Approval</Label>
                      <p className="text-xs text-gray-400 mt-1">All listings must be approved by admin</p>
                    </div>
                    <Switch defaultChecked={platformQuery.data.listing.requireApproval} />
                  </div>
                  <div className="space-y-2">
                    <Label>Approval Time (days)</Label>
                    <Input
                      type="number"
                      defaultValue={platformQuery.data.listing.approvalDays}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Seller Rules */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light">Seller Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Min Seller Rating</Label>
                      <Input
                        type="number"
                        step="0.1"
                        defaultValue={platformQuery.data.seller.minimumSellerRating}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Min Completion Rate</Label>
                      <Input
                        type="number"
                        defaultValue={platformQuery.data.seller.minimumCompletionRate}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Require Verification</Label>
                    <Switch defaultChecked={platformQuery.data.seller.requireVerification} />
                  </div>
                </CardContent>
              </Card>

              {/* Security Rules */}
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-lg font-light flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Security Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Rate Limiting</Label>
                    <Switch defaultChecked={platformQuery.data.security.enableRateLimiting} />
                  </div>
                  <div className="space-y-2">
                    <Label>Login Attempts Before Lockout</Label>
                    <Input
                      type="number"
                      defaultValue={platformQuery.data.security.loginAttempts}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      defaultValue={platformQuery.data.security.sessionTimeout}
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Two-Factor Authentication</Label>
                    <Switch defaultChecked={platformQuery.data.security.enableTwoFactorAuth} />
                  </div>
                </CardContent>
              </Card>

              <Button className="bg-purple-600 hover:bg-purple-700 w-full">
                Save Platform Rules
              </Button>
            </>
          )}
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <Card className="bg-yellow-500/10 border-yellow-500/30">
            <CardHeader>
              <CardTitle className="text-base font-light flex items-center gap-2 text-yellow-400">
                <AlertCircle className="w-5 h-5" />
                Terms and Policies
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="terms-url">Terms & Conditions URL</Label>
                <Input
                  id="terms-url"
                  type="url"
                  defaultValue="https://theluxela.com/terms"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacy-url">Privacy Policy URL</Label>
                <Input
                  id="privacy-url"
                  type="url"
                  defaultValue="https://theluxela.com/privacy"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Require User Acceptance</Label>
                <Switch defaultChecked={true} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-lg font-light">Return Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Default Return Window (days)</Label>
                <Input
                  type="number"
                  defaultValue="30"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label>Restocking Fee (%)</Label>
                <Input
                  type="number"
                  defaultValue="10"
                  className="bg-gray-800 border-gray-700"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Sellers to Customize</Label>
                <Switch defaultChecked={true} />
              </div>
            </CardContent>
          </Card>

          <Button className="bg-purple-600 hover:bg-purple-700 w-full">
            Save Compliance Settings
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}