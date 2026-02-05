'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Phone, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'general_inquiry', label: 'General Inquiry' },
  { value: 'partnership', label: 'Partnership Opportunity' },
  { value: 'other', label: 'Other' },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const isFormValid =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.subject.trim() &&
    formData.message.trim() &&
    formData.category;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      category: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        category: '',
      });

      // Reset submitted state after 5 seconds
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#ECE3BE]/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#BEE3EC]/5 rounded-full blur-3xl" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 relative pb-4">
            Get in Touch
            <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-[#EA795B] via-[#8451E1] to-[#BEE3EC] rounded-full"></span>
          </h1>
          <p className="text-[#808080] text-lg">
            Have a question or feedback? We'd love to hear from you. Send us a
            message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Contact Info Card 1 - Coral */}
          <div className="bg-[#141414] border-2 border-[#EA795B]/30 rounded-lg p-6 hover:border-[#EA795B]/60 hover:bg-[#EA795B]/5 transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 bg-[#EA795B]/20 rounded-lg mb-4">
              <Mail className="w-6 h-6 text-[#EA795B]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Email</h3>
            <p className="text-[#808080] text-sm mb-4">
              Send us an email anytime
            </p>
            <a
              href="mailto:support@luxela.com"
              className="text-[#EA795B] hover:text-[#ECBEE3] font-medium transition-colors"
            >
              support@luxela.com
            </a>
          </div>

          {/* Contact Info Card 2 - Cream */}
          <div className="bg-[#141414] border-2 border-[#ECE3BE]/30 rounded-lg p-6 hover:border-[#ECE3BE]/60 hover:bg-[#ECE3BE]/5 transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 bg-[#ECE3BE]/20 rounded-lg mb-4">
              <Clock className="w-6 h-6 text-[#ECE3BE]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Response Time
            </h3>
            <p className="text-[#808080] text-sm mb-4">
              Typically within 24 hours
            </p>
            <p className="text-[#ECE3BE] text-sm font-medium">
              Monday - Friday, 9 AM - 6 PM EST
            </p>
          </div>

          {/* Contact Info Card 3 - Cyan */}
          <div className="bg-[#141414] border-2 border-[#BEE3EC]/30 rounded-lg p-6 hover:border-[#BEE3EC]/60 hover:bg-[#BEE3EC]/5 transition-all duration-300">
            <div className="flex items-center justify-center w-12 h-12 bg-[#BEE3EC]/20 rounded-lg mb-4">
              <Phone className="w-6 h-6 text-[#BEE3EC]" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Support</h3>
            <p className="text-[#808080] text-sm mb-4">
              Chat with our support team
            </p>
            <p className="text-[#BEE3EC] text-sm font-medium">
              Available 24/7
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-[#141414] border-2 border-[#ECBEE3]/30 rounded-lg p-8 hover:border-[#ECBEE3]/50 transition-colors duration-300">
          <h2 className="text-2xl font-bold text-white mb-6 relative pb-3">
            Send us a Message
            <span className="absolute bottom-0 left-0 w-16 h-0.5 bg-gradient-to-r from-[#ECBEE3] to-[#BEE3EC]"></span>
          </h2>

          {submitted && (
            <div className="mb-6 p-4 bg-green-500/10 border-2 border-green-500/30 rounded-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-500 font-medium">Message sent successfully!</p>
                <p className="text-green-500/80 text-sm">
                  Thank you for contacting us. We'll get back to you soon.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border-2 border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-500 font-medium">Error</p>
                <p className="text-red-500/80 text-sm">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-[#ECE3BE] mb-2">
                Full Name *
              </label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="bg-[#0E0E0E] border-2 border-[#ECE3BE]/30 focus:border-[#ECE3BE]/60 text-white placeholder:text-[#808080] transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-[#BEE3EC] mb-2">
                Email Address *
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="bg-[#0E0E0E] border-2 border-[#BEE3EC]/30 focus:border-[#BEE3EC]/60 text-white placeholder:text-[#808080] transition-all"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-[#EA795B] mb-2">
                Category *
              </label>
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="bg-[#0E0E0E] border-2 border-[#EA795B]/30 focus:border-[#EA795B]/60 text-white transition-all">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-[#141414] border-2 border-[#EA795B]/30">
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-[#BEECE3] mb-2">
                Subject *
              </label>
              <Input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this about?"
                className="bg-[#0E0E0E] border-2 border-[#BEECE3]/30 focus:border-[#BEECE3]/60 text-white placeholder:text-[#808080] transition-all"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-[#ECBEE3] mb-2">
                Message *
              </label>
              <Textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Please describe your message in detail..."
                rows={6}
                className="bg-[#0E0E0E] border-2 border-[#ECBEE3]/30 focus:border-[#ECBEE3]/60 text-white placeholder:text-[#808080] resize-none transition-all"
              />
              <p className="text-xs text-[#808080] mt-2">Min 10 characters</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={!isFormValid || loading}
                className="flex-1 bg-gradient-to-b from-[#8451E1] to-[#7240D0] hover:from-[#9468F2] hover:to-[#8451E1] text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:shadow-lg hover:shadow-[#8451E1]/50"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: '',
                    category: '',
                  });
                  setError('');
                }}
                variant="outline"
                className="border-2 border-[#ECE3BE]/30 text-[#808080] hover:text-white hover:bg-[#1a1a1a] hover:border-[#ECE3BE]/60 transition-all"
              >
                Clear
              </Button>
            </div>
          </form>

          <p className="text-xs text-[#808080] mt-6 text-center">
            We respect your privacy. Your information will only be used to respond to your inquiry.
          </p>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6 text-center relative pb-3">
            Frequently Asked Questions
            <span className="block absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-[#BEE3EC] to-[#ECE3BE]"></span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                question: 'How long does it take to get a response?',
                answer:
                  'We typically respond to all inquiries within 24 hours during business days (Monday-Friday, 9 AM - 6 PM EST).',
              },
              {
                question: 'Can I report a bug directly?',
                answer:
                  'Yes! Select "Bug Report" as the category and describe the issue in detail. Our technical team will investigate and get back to you.',
              },
              {
                question: 'Do you accept partnership inquiries?',
                answer:
                  'Absolutely! We are interested in strategic partnerships. Please select "Partnership Opportunity" and tell us about your proposal.',
              },
              {
                question: 'What if I have an urgent issue?',
                answer:
                  'For urgent matters, please mark your message as high priority in the description, and our team will prioritize your request.',
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-[#141414] border-2 border-[#BEECE3]/30 rounded-lg p-6 hover:border-[#BEECE3]/60 hover:bg-[#BEECE3]/5 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-white mb-3 text-[#ECE3BE]">
                  {faq.question}
                </h3>
                <p className="text-[#808080] text-sm leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}