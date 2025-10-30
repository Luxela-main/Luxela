import { Breadcrumb } from "@/components/dashboard/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Eye } from "lucide-react"

export default function SettingsPage() {
  return (
    <div >
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
                <div className="text-white font-medium">JOHN DOE</div>
              </div>
              <Button variant="ghost" className="text-[#8451e1] hover:text-[#7041c7] hover:bg-transparent text-sm">
                Edit
              </Button>
            </div>

            {/* Email */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[#acacac] text-sm mb-2">Email</label>
                <div className="text-white">johndoedaniels@gmail.com</div>
              </div>
              <Button variant="ghost" className="text-[#8451e1] hover:text-[#7041c7] hover:bg-transparent text-sm">
                Edit
              </Button>
            </div>

            {/* Mobile Phone Number */}
            <div className="flex items-center justify-between">
              <div>
                <label className="block text-[#acacac] text-sm mb-2">Mobile Phone Number</label>
              </div>
              <Button variant="ghost" className="text-[#8451e1] hover:text-[#7041c7] hover:bg-transparent text-sm">
                Add Number
              </Button>
            </div>

            {/* Country */}
            <div>
              <label className="block text-[#acacac] text-sm mb-2">Country</label>
              <div className="text-[#7e7e7e]">Nigeria</div>
            </div>

            {/* State of residence */}
            <div>
              <label className="block text-[#acacac] text-sm mb-2">State of residence</label>
              <select className="w-full bg-[#141414] border border-[#212121] rounded-lg p-3 text-[#7e7e7e] focus:outline-none focus:border-[#8451e1]">
                <option>Select city/town</option>
              </select>
            </div>

            {/* Date of birth */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <label className="block text-[#acacac] text-sm mb-2">Date of birth</label>
                <Input
                  type="text"
                  placeholder="mm/dd/yyyy"
                  className="bg-[#141414] border-[#212121] text-[#7e7e7e] placeholder:text-[#595959]"
                />
              </div>
              <Button variant="ghost" className="text-[#8451e1] hover:text-[#7041c7] hover:bg-transparent text-sm ml-4">
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Password Change Section */}
        <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121]">
          <h2 className="text-white text-lg font-semibold mb-2">Account Details</h2>
          <p className="text-[#7e7e7e] text-sm mb-6">Change or reset your password</p>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type="password"
                placeholder="Enter current password"
                className="bg-[#141414] border-[#212121] text-white placeholder:text-[#595959] pr-10"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7e7e] hover:text-white">
                <Eye className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Input
                type="password"
                placeholder="Enter New password"
                className="bg-[#141414] border-[#212121] text-white placeholder:text-[#595959] pr-10"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7e7e] hover:text-white">
                <Eye className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <Input
                type="password"
                placeholder="Enter New password"
                className="bg-[#141414] border-[#212121] text-white placeholder:text-[#595959] pr-10"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e7e7e] hover:text-white">
                <Eye className="w-5 h-5" />
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
