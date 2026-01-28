'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { grantAdminRole } from '@/app/actions/admin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Shield, Mail, ArrowLeft } from 'lucide-react';

export default function AdminMembersPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleGrantAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const result = await grantAdminRole(email, password);

      if (result.success) {
        setMessage({
          type: 'success',
          text: `✅ Admin access granted to ${email}. They can now sign in at /admin/signin`,
        });
        setEmail('');
        setPassword('');
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to grant admin access',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-amber-600 hover:text-amber-700 mb-4 font-medium transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Members</h1>
          </div>
          <p className="text-gray-600">Grant admin access to team members</p>
        </div>

        {/* Grant Admin Card */}
        <Card className="border-0 shadow-lg mb-8">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-amber-600" />
              Add New Admin
            </CardTitle>
            <CardDescription>
              Enter the email of the person you want to grant admin access
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleGrantAdmin} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Member Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-gray-300"
                />
              </div>

              {/* Admin Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-gray-300"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter the admin password to verify your authority
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-2"
              >
                {loading ? 'Granting Access...' : 'Grant Admin Access'}
              </Button>
            </form>

            {/* Messages */}
            {message && (
              <div
                className={`mt-4 p-4 rounded-lg flex gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-0 shadow-lg bg-blue-50 border-l-4 border-blue-400">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ol className="space-y-2 text-sm text-blue-800">
              <li>1. Enter the email of your team member</li>
              <li>2. Enter the admin password to verify you have authority</li>
              <li>3. Click "Grant Admin Access"</li>
              <li>4. The team member can now sign in at <code className="bg-white px-2 py-1 rounded font-mono">/admin/signin</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}