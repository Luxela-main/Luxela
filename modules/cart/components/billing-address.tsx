import React from "react";
import { AdInput } from "@/components/input/TextInput";
import { Formik, Form } from "formik";
import { Button } from "@/components/ui/button";
import { BillingAddressValidationSchema } from "@/lib/utils/validation";
import { useCartState } from "../context";

interface BillingAddressStepProps {
  onNext?: () => void;
}

export const BillingAddressStep = ({ onNext }: BillingAddressStepProps) => {
  const { checkout } = useCartState();

  const handleSubmit = (values: any) => {
    console.log("Shipping details:", values);
    if (onNext) {
      onNext();
    }
  };

  return (
    <div className="text-center text-gray-400">
      <div className="bg-[#121212] p-6 rounded-xl border border-[#2a2a2a] space-y-6 w-full max-w-3xl mx-auto">
        <Formik
          initialValues={{
            fullName: "",
            email: "",
            phone: "",
            state: "",
            city: "",
            address: "",
            postalCode: "",
            saveDetails: false,
          }}
          validationSchema={BillingAddressValidationSchema}
          onSubmit={handleSubmit}>
          {({ values, setFieldValue, handleSubmit, isValid, dirty }) => (
            <Form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-white mb-4">
                  Shipping details
                </h2>

                <div className="mb-5">
                  <AdInput
                    label="Full name"
                    name="fullName"
                    placeholder="Enter your full name"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <AdInput
                    label="Email address"
                    name="email"
                    placeholder="Enter your email address"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
                  />
                  <AdInput
                    label="Phone number"
                    name="phone"
                    placeholder="Enter your phone number"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <AdInput
                    label="State of residence"
                    name="state"
                    placeholder="Enter your state"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
                  />
                  <AdInput
                    label="City"
                    name="city"
                    placeholder="Enter your city"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="mb-5">
                  <AdInput
                    label="House address"
                    name="address"
                    placeholder="Enter your house address"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
                  />
                </div>

                <div className="mb-5">
                  <AdInput
                    label="Postal code"
                    name="postalCode"
                    placeholder="Enter your postal code"
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-5">
                <h3 className="text-sm text-gray-400 mb-3">Save details</h3>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    name="saveDetails"
                    checked={values.saveDetails}
                    onChange={(e) =>
                      setFieldValue("saveDetails", e.target.checked)
                    }
                    className="w-4 h-4 rounded border-gray-500 bg-[#1a1a1a] focus:ring-purple-600 cursor-pointer"
                  />
                  <span>
                    Save my information for future checkouts in{" "}
                    <span className="text-purple-500 font-medium">Luxela</span>
                  </span>
                </label>
              </div>
              <div>
                <Button
                  type="submit"
                  className="bg-purple-500"
                  disabled={!isValid || !dirty}>
                  Confirm Shipping Address
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <div className="bg-[#1a1a1a] text-white p-6 rounded-2xl space-y-4 w-full max-w-3xl mx-auto mt-6">
        <div>
          <p className="text-lg font-semibold">
            Your Payment Information Is Safe with Luxela
          </p>
        </div>

        <div>
          <p className="text-gray-300 leading-relaxed">
            At <span className="text-purple-500 font-medium">Luxela</span>, your
            financial security comes first. Whether you're paying with crypto or
            cards, every transaction is protected by industry-leading encryption
            and privacy standards.
          </p>
        </div>

        <ul className="list-disc list-inside text-gray-400 space-y-2">
          <li>
            All wallet connections use secure, end-to-end encrypted protocols.
          </li>
          <li>
            Your payment details are encrypted and never stored without your
            consent.
          </li>
          <li>
            We never sell, share, or expose your card or wallet information to
            third parties.
          </li>
        </ul>
      </div>
    </div>
  );
};
