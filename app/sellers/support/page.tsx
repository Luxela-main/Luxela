"use client"

import { useState } from "react"
import Link from "next/link"
import { Headphones, ChevronDown, MessageCircle, FileText, Search, Send, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/lib/trpc"
import { toastSvc } from "@/services/toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface FAQ {
  id: number
  question: string
  answer: string
}

const CATEGORIES = [
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "technical_issue", label: "Technical Issue" },
  { value: "payment_problem", label: "Payment Problem" },
  { value: "order_issue", label: "Order Issue" },
  { value: "refund_request", label: "Refund Request" },
  { value: "account_issue", label: "Account Issue" },
  { value: "listing_help", label: "Listing Help" },
  { value: "other", label: "Other" },
]

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
]

const SELLER_FAQS: FAQ[] = [
  {
    id: 1,
    question: "How do I list a new product on Luxela?",
    answer: "Click on 'New Listing' in the sidebar menu. Fill in the product details including title, description, images, price, and inventory. Add at least 3-5 high-quality images. Our guidelines recommend clear product photos with multiple angles and lifestyle shots. Once approved by our review team, your listing will go live."
  },
  {
    id: 2,
    question: "What are the commission rates?",
    answer: "Commission rates vary by category but typically range from 8-15% of the sale price. Service fees of 2.9% + fixed amount apply to each transaction. You can view category-specific rates in your account settings. Premium sellers may qualify for reduced commissions."
  },
  {
    id: 3,
    question: "When and how do I get paid?",
    answer: "Payments are processed every 7 days to your registered bank account or payment method. Funds are released after the order is delivered and the customer confirms receipt. You can track your earnings in the Payouts section."
  },
  {
    id: 4,
    question: "How do I handle returns and refunds?",
    answer: "When a customer initiates a return, you'll receive a notification. Inspect the returned item and approve or reject the refund within 48 hours. Approved refunds are processed within 3-5 business days. Items in original condition with tags are eligible for full refunds."
  },
  {
    id: 5,
    question: "What happens if a customer disputes an order?",
    answer: "We'll notify you immediately of any disputes. You have 48 hours to respond with evidence (tracking info, photos, etc.). Our support team will review both sides and make a fair decision. Most disputes are resolved within 5 business days."
  },
  {
    id: 6,
    question: "How can I improve my seller rating?",
    answer: "Maintain a 4.5+ star rating by: providing accurate product descriptions, using high-quality images, shipping promptly, packaging well, and communicating clearly with customers. Respond to messages within 24 hours and resolve issues quickly to build trust."
  },
  {
    id: 7,
    question: "Can I edit a listing that's already live?",
    answer: "Yes, you can edit product details, prices, and inventory at any time. However, once an order is placed, you cannot change the product specifications for that order. Major changes like category may require re-approval by our review team."
  },
  {
    id: 8,
    question: "What are the best practices for product descriptions?",
    answer: "Write clear, detailed descriptions including dimensions, materials, care instructions, and unique features. Use simple language and highlight key benefits. Include shipping and handling information. Good descriptions reduce returns and inquiries from customers."
  },
  {
    id: 9,
    question: "How do I monitor my sales performance?",
    answer: "Use the Sales and Reports section in your dashboard. Track metrics like total revenue, number of orders, conversion rates, and customer reviews. Export reports for detailed analysis. Our analytics help you identify trends and optimize your listings."
  },
  {
    id: 10,
    question: "What should I do if my account is suspended?",
    answer: "Review the suspension notice for the specific reason. Common reasons include policy violations, low ratings, or suspicious activity. Contact our support team immediately with evidence of your compliance. You can appeal within 30 days of suspension."
  }
]

const STATUS_COLORS = {
  open: "bg-yellow-900/30 text-yellow-200",
  in_progress: "bg-blue-900/30 text-blue-200",
  resolved: "bg-green-900/30 text-green-200",
  closed: "bg-gray-900/30 text-gray-200",
}

const PRIORITY_COLORS = {
  low: "text-green-400",
  medium: "text-yellow-400",
  high: "text-orange-400",
  urgent: "text-red-400",
}

export default function Support() {
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<any>(null)
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [submitEmail, setSubmitEmail] = useState("")
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    category: "general_inquiry",
    priority: "medium",
  })

  // Fetch tickets
  const { data: tickets = [], isLoading, refetch } = (trpc.support as any).getTickets.useQuery({})

  // Create ticket mutation
  const createMutation = (trpc.support as any).createTicket.useMutation({
    onSuccess: () => {
      toastSvc.success("Support ticket created successfully")
      setFormData({ subject: "", description: "", category: "general_inquiry", priority: "medium" })
      setShowForm(false)
      refetch()
    },
    onError: (error: any) => {
      toastSvc.apiError(error)
    },
  })

  // Update ticket mutation
  const updateMutation = (trpc.support as any).updateTicket.useMutation({
    onSuccess: () => {
      toastSvc.success("Ticket updated successfully")
      setShowDetail(false)
      refetch()
    },
    onError: (error: any) => {
      toastSvc.apiError(error)
    },
  })

  const handleCreateTicket = () => {
    if (!formData.subject.trim() || !formData.description.trim()) {
      toastSvc.error("Please fill in all required fields")
      return
    }
    if (formData.subject.length < 5) {
      toastSvc.error("Subject must be at least 5 characters")
      return
    }
    if (formData.description.length < 10) {
      toastSvc.error("Description must be at least 10 characters")
      return
    }
    createMutation.mutate(formData)
  }

  const handleUpdateStatus = (newStatus: string) => {
    if (!selectedTicket) return
    updateMutation.mutate({
      ticketId: selectedTicket.id,
      status: newStatus,
    })
    setSelectedTicket({ ...selectedTicket, status: newStatus })
  }

  const handleContactSupport = () => {
    if (!submitEmail || !submitEmail.includes('@')) {
      toastSvc.error("Please enter a valid email address")
      return
    }
    toastSvc.success("Your message has been sent. We'll get back to you within 24 hours.")
    setSubmitEmail("")
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "resolved":
        return "✓"
      case "open":
        return "!"
      case "in_progress":
        return "..."
      default:
        return null
    }
  }

  const filteredFAQs = SELLER_FAQS.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="pt-16 lg:pt-0 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Seller Support Center</h1>
          <p className="text-gray-400">Get help with selling, shipping, and account management</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:bg-[#252525] transition-colors text-left cursor-pointer group">
          <MessageCircle className="w-6 h-6 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-white font-semibold">Live Chat</p>
          <p className="text-gray-400 text-sm">Chat with our support team</p>
        </button>
        <button className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:bg-[#252525] transition-colors text-left cursor-pointer group">
          <FileText className="w-6 h-6 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-white font-semibold">Seller Guide</p>
          <p className="text-gray-400 text-sm">Browse our documentation</p>
        </button>
        <Link href="/sellers/support-tickets">
          <button className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:bg-[#252525] transition-colors text-left cursor-pointer group w-full">
            <Ticket className="w-6 h-6 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-white font-semibold">Support Tickets</p>
            <p className="text-gray-400 text-sm">View & create tickets</p>
          </button>
        </Link>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="bg-[#1a1a1a] border border-[#333333] rounded-lg p-4 hover:bg-[#252525] transition-colors text-left cursor-pointer group">
          <Headphones className="w-6 h-6 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
          <p className="text-white font-semibold">Quick Support</p>
          <p className="text-gray-400 text-sm">Submit quick ticket</p>
        </button>
      </div>

      {/* Search FAQs */}
      <div className="mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4 mb-12">
        <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
        {filteredFAQs.map((faq) => (
          <div
            key={faq.id}
            className="bg-[#1a1a1a] border border-[#333333] rounded-lg overflow-hidden hover:border-[#444444] transition-colors"
          >
            <button
              onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-[#252525] transition-colors cursor-pointer"
            >
              <span className="text-white font-medium">{faq.question}</span>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedFAQ === faq.id ? 'rotate-180' : ''
                }`}
              />
            </button>
            {expandedFAQ === faq.id && (
              <div className="px-4 pb-4 pt-0 border-t border-[#333333] bg-[#0f0f0f]">
                <p className="text-gray-400">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="bg-[#1a1a1a] rounded-lg p-6 mb-6 border border-[#333]">
          <h2 className="text-lg font-semibold mb-4">Create Support Ticket</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject *</label>
              <Input
                placeholder="Brief description of your issue"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="bg-[#242424] border-[#333]"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 5 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <Textarea
                placeholder="Please describe your issue in detail"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#242424] border-[#333] min-h-[120px]"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-[#242424] border-[#333]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Priority</label>
                <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                  <SelectTrigger className="bg-[#242424] border-[#333]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1a1a1a] border-[#333]">
                    {PRIORITIES.map((pri) => (
                      <SelectItem key={pri.value} value={pri.value}>
                        {pri.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              className="bg-purple-600 hover:bg-purple-700 w-full"
              onClick={handleCreateTicket}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? "Creating..." : "Submit Ticket"}
            </Button>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="space-y-4 mb-8">
        <h2 className="text-lg font-semibold">Your Support Tickets</h2>
        {isLoading ? (
          <div className="bg-[#1a1a1a] rounded-lg p-8 text-center text-gray-400">
            Loading tickets...
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg p-8 text-center text-gray-400">
            <Headphones className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No support tickets yet</p>
            <p className="text-sm mt-1">Create a ticket to get help with any issues</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 hover:border-[#444] cursor-pointer transition"
                onClick={() => {
                  setSelectedTicket(ticket)
                  setShowDetail(true)
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-200">{ticket.subject}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${(STATUS_COLORS as any)[ticket.status]}`}>
                        {getStatusIcon(ticket.status)}
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{ticket.description.substring(0, 100)}...</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Category: {CATEGORIES.find((c) => c.value === ticket.category)?.label}</span>
                      <span className={`font-medium ${(PRIORITY_COLORS as any)[ticket.priority]}`}>
                        Priority: {ticket.priority}
                      </span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Support Section */}
      <div className="mt-12 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-2 text-center">Need immediate assistance?</h3>
        <p className="text-gray-400 mb-6 text-center">Our dedicated seller support team is ready to help</p>
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="email"
            placeholder="Enter your email"
            value={submitEmail}
            onChange={(e) => setSubmitEmail(e.target.value)}
            className="flex-1 bg-[#1a1a1a] border border-[#333333] rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleContactSupport}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg transition-colors font-medium cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <Send className="w-4 h-4" />
            Send Message
          </button>
        </div>
      </div>

      {/* Ticket Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-2xl">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedTicket.subject}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div>
                  <label className="text-sm font-medium text-gray-400">Description</label>
                  <p className="text-gray-200 mt-2">{selectedTicket.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-400">Category</label>
                    <p className="text-gray-200 mt-1">
                      {CATEGORIES.find((c) => c.value === selectedTicket.category)?.label}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-400">Priority</label>
                    <p className={`mt-1 font-medium ${(PRIORITY_COLORS as any)[selectedTicket.priority]}`}>
                      {selectedTicket.priority.charAt(0).toUpperCase() + selectedTicket.priority.slice(1)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Status</label>
                  <Select value={selectedTicket.status} onValueChange={handleUpdateStatus}>
                    <SelectTrigger className="bg-[#242424] border-[#333] mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333]">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                  <div>
                    <span>Created: {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span>Updated: {new Date(selectedTicket.updatedAt).toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}