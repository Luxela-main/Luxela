"use client";

import { Breadcrumb } from "@/components/buyer/dashboard/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, Plus, Edit2, Trash2 } from "lucide-react"
import { useProfile } from "@/context/ProfileContext"
import { useAuth } from "@/context/AuthContext"
import { trpc } from "@/lib/trpc"
import { useState } from "react"

export default function SettingsPageContent() {
  const { profile, loading } = useProfile();
  const { user } = useAuth();
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState({
    houseAddress: '',
    city: '',
    postalCode: '',
    isDefault: false
  });

  const { data: response } = trpc.buyer.getBillingAddresses.useQuery({ page: 1, limit: 10 });
  const addresses = response?.data || [];
  const createAddressMutation = trpc.buyer.createBillingAddress.useMutation();
  const updateAddressMutation = trpc.buyer.updateBillingAddress.useMutation();
  const deleteAddressMutation = trpc.buyer.deleteBillingAddress.useMutation();

  const formattedDOB = profile?.dateOfBirth 
    ? new Date(profile.dateOfBirth).toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      })
    : '';

  if (loading) {
    return (
      <div>
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />
        <h1 className="text-white text-2xl font-semibold mb-8">Account Settings</h1>
        <div className="text-[#7e7e7e]">Loading settings...</div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Settings" }]} />

      <h1 className="text-white text-2xl font-semibold mb-8">Account Settings</h1>

      <div className="max-w-4xl space-y-8">
        {/* Account Details Section */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
          <h2 className="text-white text-lg font-semibold mb-6">Account Details</h2>

          <div className="space-y-6">
            {/* Name */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[#acacac] text-sm mb-2">Name</label>
                <div className="text-white font-medium capitalize">{profile?.fullName || 'N/A'}</div>
              </div>
              <Button variant="ghost" className="text-[#8451e1] hover:text-[#7041c7] hover:bg-transparent text-sm">
                Edit
              </Button>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[#acacac] text-sm mb-2">Email</label>
                <div className="text-white">{profile?.email || user?.email || 'N/A'}</div>
              </div>
              <Button variant="ghost" className="text-[#8451e1] hover:text-[#7041c7] hover:bg-transparent text-sm">
                Edit
              </Button>
            </div>

            {/* Mobile Phone Number */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[#acacac] text-sm mb-2">Mobile Phone Number</label>
                {profile?.phoneNumber && (
                  <div className="text-white">{profile.phoneNumber}</div>
                )}
              </div>
              <Button variant="ghost" className="text-[#8451e1] hover:text-[#7041c7] hover:bg-transparent text-sm">
                {profile?.phoneNumber ? 'Edit' : 'Add Number'}
              </Button>
            </div>

            {/* Country */}
            <div>
              <label className="block text-[#acacac] text-sm mb-2">Country</label>
              <div className="text-[#7e7e7e]">{profile?.country || 'Not set'}</div>
            </div>

            {/* State of residence */}
            <div>
              <label className="block text-[#acacac] text-sm mb-2">State of residence</label>
              <select 
                className="w-full bg-[#141414] border border-[#212121] rounded-lg p-3 text-[#7e7e7e] focus:outline-none focus:border-[#8451e1]"
                defaultValue={profile?.state || ''}
              >
                <option value="">Select city/town</option>
                <option value="Lagos">Lagos</option>
                <option value="Abuja">Abuja</option>
                <option value="Kano">Kano</option>
              </select>
            </div>

            {/* Date of birth */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-[#acacac] text-sm mb-2">Date of birth</label>
                <Input
                  type="text"
                  placeholder="mm/dd/yyyy"
                  defaultValue={formattedDOB}
                  className="bg-[#141414] border-[#212121] text-white placeholder:text-[#595959]"
                />
              </div>
              <Button variant="ghost" className="text-[#8451e1] hover:text-[#7041c7] hover:bg-transparent text-sm ml-4">
                {profile?.dateOfBirth ? 'Edit' : 'Add'}
              </Button>
            </div>
          </div>
        </div>

        {/* Billing Address Section */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-lg font-semibold">Billing Addresses</h2>
            <Button 
              onClick={() => {
                setShowAddressForm(!showAddressForm);
                setEditingAddressId(null);
                setAddressForm({ houseAddress: '', city: '', postalCode: '', isDefault: false });
              }}
              className="bg-[#8451e1] hover:bg-[#7041c7] text-white text-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Address
            </Button>
          </div>

          {showAddressForm && (
            <div className="bg-[#141414] rounded-lg p-4 mb-6 border border-[#212121]">
              <div className="space-y-4">
                <Input
                  placeholder="House Address"
                  value={addressForm.houseAddress}
                  onChange={(e) => setAddressForm({...addressForm, houseAddress: e.target.value})}
                  className="bg-[#0a0a0a] border-[#212121] text-white placeholder:text-[#595959]"
                />
                <Input
                  placeholder="City"
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                  className="bg-[#0a0a0a] border-[#212121] text-white placeholder:text-[#595959]"
                />
                <Input
                  placeholder="Postal Code"
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({...addressForm, postalCode: e.target.value})}
                  className="bg-[#0a0a0a] border-[#212121] text-white placeholder:text-[#595959]"
                />
                <label className="flex items-center gap-2 text-[#acacac]">
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({...addressForm, isDefault: e.target.checked})}
                    className="w-4 h-4"
                  />
                  Set as default address
                </label>
                <div className="flex gap-2 justify-end">
                  <Button 
                    onClick={() => setShowAddressForm(false)}
                    variant="ghost"
                    className="text-[#7e7e7e] hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (editingAddressId) {
                        updateAddressMutation.mutate({ addressId: editingAddressId, ...addressForm });
                      } else {
                        createAddressMutation.mutate(addressForm);
                      }
                      setShowAddressForm(false);
                    }}
                    className="bg-[#8451e1] hover:bg-[#7041c7] text-white"
                  >
                    {editingAddressId ? 'Update' : 'Add'} Address
                  </Button>
                </div>
              </div>
            </div>
          )}

          {Array.isArray(addresses) && addresses.length > 0 ? (
            <div className="space-y-3">
              {addresses.map((addr: any) => (
                <div key={addr.id} className="bg-[#141414] rounded-lg p-4 border border-[#212121] flex justify-between items-start">
                  <div className="flex-1">
                    <div className="text-white font-medium">{addr.houseAddress}</div>
                    <div className="text-[#7e7e7e] text-sm">{addr.city}, {addr.postalCode}</div>
                    {addr.isDefault && <div className="text-[#8451e1] text-xs mt-2">Default Address</div>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => {
                        setEditingAddressId(addr.id);
                        setAddressForm(addr);
                        setShowAddressForm(true);
                      }}
                      variant="ghost"
                      size="sm"
                      className="text-[#8451e1] hover:text-[#7041c7]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => deleteAddressMutation.mutate({ addressId: addr.id })}
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[#7e7e7e] text-center py-8">No billing addresses added yet</div>
          )}
        </div>

        {/* Password Change Section */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
          <h2 className="text-white text-lg font-semibold mb-2">Password</h2>
          <p className="text-[#7e7e7e] text-sm mb-6">Change or reset your password</p>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                placeholder="Enter current password"
                className="bg-[#141414] border-[#212121] text-white placeholder:text-[#595959] pr-10"
              />
              <button 
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7e7e] hover:text-white"
              >
                {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                placeholder="Enter New password"
                className="bg-[#141414] border-[#212121] text-white placeholder:text-[#595959] pr-10"
              />
              <button 
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7e7e] hover:text-white"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New password"
                className="bg-[#141414] border-[#212121] text-white placeholder:text-[#595959] pr-10"
              />
              <button 
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7e7e] hover:text-white"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex justify-end pt-2">
              <Button className="bg-[#8451e1] hover:bg-[#7041c7] text-white px-8">Save Changes</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}