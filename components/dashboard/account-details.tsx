import { Card } from "../ui/Card"

export function AccountDetails() {
  return (
    <Card className="bg-[#1a1a1a] border-[#212121] p-6">
      <h2 className="text-white text-lg font-semibold mb-6">Account Details</h2>

      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Full name</label>
          <p className="text-white">John Doe Daniels</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Email address</label>
          <p className="text-white">johndoedaniels@gmail.com</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Date of birth</label>
          <p className="text-white">N/A</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Phone number</label>
          <p className="text-white">N/A</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">Country</label>
          <p className="text-white">Nigeria</p>
        </div>

        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">State of residence</label>
          <p className="text-white">N/A</p>
        </div>
      </div>
    </Card>
  )
}
