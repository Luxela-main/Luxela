import { Card } from "../ui/Card"
import { useProfile } from "@/context/ProfileContext"
import { useAuth } from "@/context/AuthContext"

export function AccountDetails() {
  const { profile, loading } = useProfile();
  const { user } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border-[#212121] p-6">
        <h2 className="text-white text-lg font-semibold mb-6">Account Details</h2>
        <div className="text-[#7e7e7e]">Loading account details...</div>
      </Card>
    );
  }

  // If no profile, show placeholder or message
  if (!profile) {
    return (
      <Card className="bg-[#1a1a1a] border-[#212121] p-6">
        <h2 className="text-white text-lg font-semibold mb-6">Account Details</h2>
        <div className="text-[#7e7e7e]">No profile found</div>
      </Card>
    );
  }

  // Format date of birth if exists
  const formattedDOB = profile.dateOfBirth 
    ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A';

  return (
    <Card className="bg-[#1a1a1a] border-[#212121] p-6">
      <h2 className="text-white text-lg font-semibold mb-6">Account Details</h2>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Full name</label>
          <p className="text-white">{profile.fullName || 'N/A'}</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Email address</label>
          <p className="text-white break-all">{profile.email || user?.email || 'N/A'}</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Date of birth</label>
          <p className="text-white">{formattedDOB}</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Phone number</label>
          <p className="text-white">{profile.phoneNumber || 'N/A'}</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Country</label>
          <p className="text-white">{profile.country || 'N/A'}</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">State of residence</label>
          <p className="text-white">{profile.state || 'N/A'}</p>
        </div>
      </div>
    </Card>
  )
}