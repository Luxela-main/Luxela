"use client";

import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, FileText } from "lucide-react";

export function HelpSettings() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-6">
      <h2 className="text-xl font-medium mb-6">Help & Support</h2>
      <p className="text-gray-400 mb-8">Need assistance? We're here to help.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#222] p-6 rounded-lg border border-[#333] flex flex-col items-center text-center hover:border-purple-600 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 text-purple-600">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-white mb-2">Documentation</h3>
          <p className="text-sm text-gray-400 mb-4">Read our guides and documentation to learn more.</p>
          <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0 h-auto">
            View Docs &rarr;
          </Button>
        </div>

        <div className="bg-[#222] p-6 rounded-lg border border-[#333] flex flex-col items-center text-center hover:border-purple-600 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 text-purple-600">
            <Mail className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-white mb-2">Email Support</h3>
          <p className="text-sm text-gray-400 mb-4">Send us an email and we'll get back to you.</p>
          <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0 h-auto">
            support@luxela.com &rarr;
          </Button>
        </div>

         <div className="bg-[#222] p-6 rounded-lg border border-[#333] flex flex-col items-center text-center hover:border-purple-600 transition-colors cursor-pointer">
          <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4 text-purple-600">
            <MessageCircle className="h-6 w-6" />
          </div>
          <h3 className="font-medium text-white mb-2">Live Chat</h3>
          <p className="text-sm text-gray-400 mb-4">Chat with our support team in real-time.</p>
          <Button variant="link" className="text-purple-400 hover:text-purple-300 p-0 h-auto">
            Start Chat &rarr;
          </Button>
        </div>
      </div>
      
      <div className="mt-12 bg-[#222] p-6 rounded-lg border border-[#333]">
        <h3 className="font-medium text-white mb-4">Frequently Asked Questions</h3>
        <div className="space-y-4">
            <details className="group">
                <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-gray-300 group-hover:text-white">
                    <span>How do I get paid?</span>
                    <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                </summary>
                <p className="text-gray-400 mt-3 group-open:animate-fadeIn">
                    Payouts are processed according to your payment settings. You can choose between Fiat (Bank Transfer, PayPal) or Cryptocurrency.
                </p>
            </details>
             <details className="group border-t border-[#333] pt-4">
                <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-gray-300 group-hover:text-white">
                    <span>How do I verify my account?</span>
                    <span className="transition group-open:rotate-180">
                        <svg fill="none" height="24" shapeRendering="geometricPrecision" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24" width="24"><path d="M6 9l6 6 6-6"></path></svg>
                    </span>
                </summary>
                <p className="text-gray-400 mt-3 group-open:animate-fadeIn">
                    Go to Profile Settings and ensure all your personal information is accurate. You may need to provide a valid ID document.
                </p>
            </details>
        </div>
      </div>
    </div>
  );
}
