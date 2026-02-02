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
    <div className="min-h-screen bg-gradient-to-br from-[#0E0E0E] to-[#1a1a1a] p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8451E1] hover:text-[#9461f1] mb-3 sm:mb-4 font-medium transition-colors text-sm sm:text-base cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Back
          </button>
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-[#8451E1]" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Admin Members</h1>
          </div>
          <p className="text-sm sm:text-base text-[#DCDCDC]">Grant admin access to team members</p>
        </div>

        {/* Grant Admin Card */}
        <Card className="border-0 shadow-lg mb-6 sm:mb-8 bg-[#1a1a1a] border border-[#2B2B2B]">
          <CardHeader className="bg-gradient-to-r from-[#1a1a1a] to-[#0E0E0E] border-b border-[#2B2B2B]">
            <CardTitle className="flex items-center gap-2 text-white">
              <Mail className="w-5 h-5 text-[#8451E1]" />
              Add New Admin
            </CardTitle>
            <CardDescription className="text-[#808080]">
              Enter the email of the person you want to grant admin access
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleGrantAdmin} className="space-y-3 sm:space-y-4">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                  Team Member Email
                </label>
                <Input
                  type="email"
                  placeholder="admin@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="border-[#2B2B2B] bg-[#0E0E0E] text-white placeholder:text-[#808080]"
                />
              </div>

              {/* Admin Password Input */}
              <div>
                <label className="block text-sm font-medium text-[#DCDCDC] mb-2">
                  Admin Password
                </label>
                <Input
                  type="password"
                  placeholder="Enter your admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="border-[#2B2B2B] bg-[#0E0E0E] text-white placeholder:text-[#808080]"
                />
                <p className="text-xs text-[#808080] mt-1">
                  Enter the admin password to verify your authority
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="w-full bg-gradient-to-r from-[#8451E1] to-[#7040d1] hover:from-[#9461f1] hover:to-[#8051e1] text-white font-semibold py-2 cursor-pointer"
              >
                {loading ? 'Granting Access...' : 'Grant Admin Access'}
              </Button>
            </form>

            {/* Messages */}
            {message && (
              <div
                className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-lg flex gap-2 sm:gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-500/10 border border-green-500/50'
                    : 'bg-red-500/10 border border-red-500/50'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                )}
                <p
                  className={`text-sm ${
                    message.type === 'success' ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {message.text}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-0 shadow-lg bg-[#8451E1]/10 border-l-4 border-[#8451E1]">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-[#8451E1] mb-2">How it works:</h3>
            <ol className="space-y-2 text-sm text-[#DCDCDC]">
              <li>1. Enter the email of your team member</li>
              <li>2. Enter the admin password to verify you have authority</li>
              <li>3. Click "Grant Admin Access"</li>
              <li>4. The team member can now sign in at <code className="bg-[#0E0E0E] px-2 py-1 rounded font-mono border border-[#2B2B2B]">/admin/signin</code></li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}