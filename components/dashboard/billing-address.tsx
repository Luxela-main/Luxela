import { Button } from "@/components/ui/button"
import { Card } from "../ui/Card"

export function BillingAddress() {
  return (
    <Card className="bg-[#1a1a1a] border-[#212121] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white text-lg font-semibold">Billing Address</h2>
        <Button
          variant="outline"
          size="sm"
          className="border-[#8451e1] text-[#8451e1] hover:bg-[#8451e1] hover:text-white bg-transparent"
        >
          Edit
        </Button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-[#7e7e7e] text-sm block mb-1">House address</label>
          <p className="text-white leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
            dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className="text-[#7e7e7e] text-sm block mb-1">City of residence</label>
            <p className="text-white">Ilorin</p>
          </div>

          <div>
            <label className="text-[#7e7e7e] text-sm block mb-1">Postal address</label>
            <p className="text-white">124657</p>
          </div>

          <div>
            <label className="text-[#7e7e7e] text-sm block mb-1">Phone Number</label>
            <p className="text-white">+2348167898786</p>
          </div>

          <div>
            <label className="text-[#7e7e7e] text-sm block mb-1">Email Addresss</label>
            <p className="text-white">johndoedaniels@gmail.com</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
