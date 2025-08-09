import { Headphones } from "lucide-react";
import { Button } from "@/components/ui/Button";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function Support() {
  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Contact Support</h1>
          <p className="text-gray-400 mt-1">
            Get help with any issues or questions you have.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#1a1a1a] rounded-lg p-6">
          <div className="flex items-center mb-6">
            <div className="bg-[#222] p-2 rounded-full mr-3">
              <Headphones className="h-6 w-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-medium">Contact Us</h2>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Subject</label>
              <Input
                placeholder="What do you need help with?"
                className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Message</label>
              <Textarea
                placeholder="Please describe your issue in detail"
                className="bg-[#222] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[150px]"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">
                Attachments (optional)
              </label>
              <div className="border border-dashed border-gray-600 rounded-lg p-4 flex flex-col items-center justify-center bg-[#222]">
                <p className="text-sm text-gray-400 mb-2">
                  Drag and drop files here or click to browse
                </p>
                <p className="text-xs text-gray-500">Max file size: 10MB</p>
              </div>
            </div>

            <Button className="bg-purple-600 hover:bg-purple-700 w-full">
              Submit Ticket
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">
              Frequently Asked Questions
            </h3>
            <div className="space-y-4">
              <div className="border-b border-[#333] pb-4">
                <h4 className="font-medium mb-2">
                  How do I add a new product?
                </h4>
                <p className="text-gray-400 text-sm">
                  You can add a new product by clicking on the "New Listing"
                  option in the sidebar menu, or by clicking the "Add Product"
                  button on the My Listings page.
                </p>
              </div>
              <div className="border-b border-[#333] pb-4">
                <h4 className="font-medium mb-2">How do I process an order?</h4>
                <p className="text-gray-400 text-sm">
                  Orders can be processed from the Sales page. Click on the
                  order you want to process, then update the status as needed.
                </p>
              </div>
              <div className="border-b border-[#333] pb-4">
                <h4 className="font-medium mb-2">
                  When will I receive payment for my sales?
                </h4>
                <p className="text-gray-400 text-sm">
                  Payments are processed within 3-5 business days after an order
                  is marked as delivered and the customer has confirmed receipt.
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">
                  How do I update my store information?
                </h4>
                <p className="text-gray-400 text-sm">
                  You can update your store information from the Settings page.
                  Click on the Settings option in the sidebar menu to access
                  your store settings.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-6">
            <h3 className="text-lg font-medium mb-4">Contact Information</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#222] rounded-full flex items-center justify-center mr-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-purple-600">
                    <path
                      d="M22 12C22 10.6868 21.7413 9.38647 21.2388 8.1731C20.7362 6.95996 19.9997 5.85742 19.0711 4.92896C18.1425 4.00024 17.0401 3.26367 15.8268 2.76123C14.6136 2.25854 13.3132 2 12 2C10.6868 2 9.38647 2.25854 8.1731 2.76123C6.95996 3.26367 5.85742 4.00024 4.92896 4.92896C3.26267 6.59552 2.25 8.88 2.25 11.25C2.25 13.62 2.94 15.33 4.13 16.5L7.5 19.5C8.75 20.5 9.5 21.5 9.5 23H14.5C14.5 21.5 15.25 20.5 16.5 19.5L19.87 16.5C21.06 15.33 21.75 13.62 21.75 11.25"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11.5C12.8284 11.5 13.5 10.8284 13.5 10C13.5 9.17157 12.8284 8.5 12 8.5C11.1716 8.5 10.5 9.17157 10.5 10C10.5 10.8284 11.1716 11.5 12 11.5Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 11.5V14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-gray-400">support@luxela.com</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#222] rounded-full flex items-center justify-center mr-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-purple-600">
                    <path
                      d="M22 16.92V19.92C22 20.4704 21.7893 20.9996 21.4142 21.3747C21.0391 21.7498 20.5099 21.9605 19.96 21.96C18.4 22.05 16.88 21.73 15.5 21.05C14.22 20.4194 13.0501 19.5535 12.06 18.5C11.0022 17.5172 10.1363 16.3473 9.50003 15.07C8.82003 13.68 8.50003 12.16 8.59003 10.6C8.58866 10.0505 8.79799 9.5213 9.17289 9.1462C9.5478 8.77111 10.0771 8.56016 10.63 8.56H13.63C14.0896 8.55581 14.5341 8.72156 14.8849 9.02824C15.2357 9.33491 15.4712 9.76275 15.55 10.22C15.6705 11.0559 15.8584 11.8762 16.11 12.67C16.2386 13.0429 16.2617 13.4444 16.1768 13.8311C16.0919 14.2178 15.9018 14.5731 15.63 14.85L14.63 15.85C15.1997 16.9387 15.9691 17.9122 16.9 18.72C17.7078 19.6509 18.6813 20.4203 19.77 20.99L20.77 19.99C21.0469 19.7182 21.4022 19.5281 21.7889 19.4432C22.1756 19.3583 22.5771 19.3814 22.95 19.51C23.7438 19.7616 24.5641 19.9495 25.4 20.07C25.8616 20.1494 26.2928 20.3879 26.6004 20.743C26.908 21.0981 27.0721 21.5474 27.06 22.01L22 16.92Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-gray-400">+234 800 123 4567</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[#222] rounded-full flex items-center justify-center mr-3">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-purple-600">
                    <path
                      d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M12 6V12L16 14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-gray-400">
                  Support hours: 9am - 5pm (Mon-Fri)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
