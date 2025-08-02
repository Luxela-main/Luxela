"use client"

import { useState } from "react"
import { Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"

export default function NewListing() {
  const [activeTab, setActiveTab] = useState("Product Information")

  return (
    <div className="p-6">
      <div className="flex items-center mb-2">
        <h1 className="text-2xl font-semibold">New Listing</h1>
      </div>
      <p className="text-gray-400 mb-6">List product and fill in your listing details</p>

      <div className="flex space-x-4 mb-6 border-b border-[#333]">
        <button
          className={`text-sm px-4 py-2 ${activeTab === "Product Information" ? "border-b-2 border-purple-600 text-white" : "text-gray-400"}`}
          onClick={() => setActiveTab("Product Information")}
        >
          Product Information
        </button>
        <button
          className={`text-sm px-4 py-2 ${activeTab === "Additional Information" ? "border-b-2 border-purple-600 text-white" : "text-gray-400"}`}
          onClick={() => setActiveTab("Additional Information")}
        >
          Additional Information
        </button>
        <button
          className={`text-sm px-4 py-2 ${activeTab === "Preview" ? "border-b-2 border-purple-600 text-white" : "text-gray-400"}`}
          onClick={() => setActiveTab("Preview")}
        >
          Preview
        </button>
      </div>

      {activeTab === "Product Information" && (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5">
            <div className="mb-6">
              <h3 className="text-sm text-gray-400 mb-4">Product image or video* (Maximum of 4 images)</h3>
              <div className="border border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-[#1a1a1a] h-72">
                <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center mb-4 border border-purple-600">
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm font-medium mb-1">Upload Image(s) or product videos</p>
                <p className="text-xs text-gray-400 mb-2">Supported file formats are .png, .jpeg, .mp4</p>
                <p className="text-xs text-gray-400">Max file size: 10mb</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center bg-[#1a1a1a] h-24">
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center bg-[#1a1a1a] h-24">
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center bg-[#1a1a1a] h-24">
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-7">
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2">Price</label>
                <Input
                  defaultValue="₦4,500.00"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Product name</label>
                <Input
                  defaultValue="Name of Product"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Product type</label>
                <Input
                  defaultValue="Clothing"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Product description</label>
                <Textarea
                  defaultValue="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur."
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600 min-h-[120px]"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Sizes available</label>
                <Input
                  defaultValue="S, L, XL, XXL, XXXL"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Release date</label>
                <Input
                  defaultValue="30-09-2024"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Suply cap</label>
                <Input
                  defaultValue="Limited supply"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Suply cap</label>
                <Input
                  defaultValue="40"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Show limited edition badge?</label>
                <Input
                  defaultValue="Show badge"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Release duration</label>
                <Input
                  defaultValue="Limited time"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Release duration</label>
                <Input
                  defaultValue="30 Days, 20 Hours"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Material/Composition</label>
                <Input
                  defaultValue="Cotton, Polyester"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Colour options</label>
                <Input
                  defaultValue="Yellow, Black, Magenta, Titanium, Bleached"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Target audience</label>
                <Input
                  defaultValue="Unisex"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Shipping options</label>
                <Input
                  defaultValue="Domestic and international shipping"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Estimated shipping time</label>
                <Input
                  defaultValue="2 Days within country, 10 Days international shipping"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Additional Information" && (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-5">
            <div className="mb-6">
              <h3 className="text-sm text-gray-400 mb-4">Product image or video* (Maximum of 4 images)</h3>
              <div className="border border-dashed border-gray-600 rounded-lg p-8 flex flex-col items-center justify-center bg-[#1a1a1a] h-72">
                <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center mb-4 border border-purple-600">
                  <Upload className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-sm font-medium mb-1">Upload Image(s) or product videos</p>
                <p className="text-xs text-gray-400 mb-2">Supported file formats are .png, .jpeg, .mp4</p>
                <p className="text-xs text-gray-400">Max file size: 10mb</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center bg-[#1a1a1a] h-24">
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center bg-[#1a1a1a] h-24">
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div className="border border-dashed border-gray-600 rounded-lg p-4 flex items-center justify-center bg-[#1a1a1a] h-24">
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center">
                  <Plus className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-7">
            <div className="space-y-6">
              <div>
                <label className="block text-sm mb-2">Material/Composition</label>
                <Input
                  placeholder="What material is your product made from"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Colors available</label>
                <Input
                  placeholder="Enter all product colours"
                  className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="block text-sm mb-2">Target audience</label>
                <div className="grid grid-cols-3 gap-4">
                  <Button variant="outline" className="bg-[#1a1a1a] border-[#333] hover:bg-[#222] hover:text-white">
                    Male
                  </Button>
                  <Button variant="outline" className="bg-[#1a1a1a] border-[#333] hover:bg-[#222] hover:text-white">
                    Female
                  </Button>
                  <Button variant="outline" className="bg-[#1a1a1a] border-[#333] hover:bg-[#222] hover:text-white">
                    Unisex
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm mb-2">Shipping option</label>
                <RadioGroup defaultValue="local" className="grid grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 bg-[#1a1a1a] border border-[#333] rounded-md p-3">
                    <RadioGroupItem value="local" id="local" className="text-purple-600" />
                    <Label htmlFor="local">Local</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#1a1a1a] border border-[#333] rounded-md p-3">
                    <RadioGroupItem value="international" id="international" className="text-purple-600" />
                    <Label htmlFor="international">International</Label>
                  </div>
                  <div className="flex items-center space-x-2 bg-[#1a1a1a] border border-[#333] rounded-md p-3">
                    <RadioGroupItem value="both" id="both" className="text-purple-600" />
                    <Label htmlFor="both">Both</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <label className="block text-sm mb-2">Estimated shipping time</label>
                <div className="mb-4">
                  <p className="text-sm text-gray-400 mb-2">Within country</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="00 Days"
                      className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    />
                    <Input
                      placeholder="00 Minutes"
                      className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">International</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="00 Days"
                      className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    />
                    <Input
                      placeholder="00 Minutes"
                      className="bg-[#1a1a1a] border-[#333] focus:border-purple-600 focus:ring-purple-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Preview" && (
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-400">Preview of your product will appear here</p>
        </div>
      )}

      <div className="flex justify-end mt-8 space-x-4">
        <Button variant="outline" className="bg-transparent border-[#333] hover:bg-[#222] hover:text-white">
          Cancel
        </Button>
        <Button className="bg-purple-600 hover:bg-purple-700">Save</Button>
      </div>
    </div>
  )
}
