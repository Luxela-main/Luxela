import { Card } from "../../ui/card"
import { useProfile } from "@/context/ProfileContext"
import { useAuth } from "@/context/AuthContext"

export function AccountDetails() {
  const { profile, loading } = useProfile();
  const { user } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <Card className="bg-[#1a1a1a] border-2 border-[#ECBEE3]/30 bg-gradient-to-br from-[#ECBEE3]/5 to-transparent p-6">
        <h2 className="text-white text-lg font-semibold mb-6">Account Details</h2>
        <div className="text-[#7e7e7e]">Loading account details...</div>
      </Card>
    );
  }

  // If no profile, show placeholder or message
  if (!profile) {
    return (
      <Card className="bg-[#1a1a1a] border-2 border-[#ECBEE3]/30 bg-gradient-to-br from-[#ECBEE3]/5 to-transparent p-6">
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
    <Card className="bg-[#1a1a1a] border-2 border-l-4 border-l-[#EA795B] border-t-[#ECBEE3] border-r-[#BEE3EC] border-[#EA795B]/30 bg-gradient-to-br from-[#ECBEE3]/5 via-[#BEECE3]/3 to-transparent p-6">
      <h2 className="text-white text-lg font-semibold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#ECBEE3] via-[#EA795B] to-[#BEE3EC]">Account Details</h2>

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