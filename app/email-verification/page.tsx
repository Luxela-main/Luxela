'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyEmailPage() {
  const inputs = Array.from({ length: 6 }, () => useRef<HTMLInputElement>(null));

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;
    if (value.length === 1 && index < inputs.length - 1) {
      inputs[index + 1].current?.focus();
    } else if (value.length === 0 && index > 0) {
      inputs[index - 1].current?.focus();
    }
  };
  const router = useRouter();

  const handleVerification = () => {
     const code = inputs.map(input => input.current?.value).join('');
     console.log('Code entered:', code);

     //Our Verification logic goes here 
     router.push("../page");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-zinc-900 text-white rounded-xl shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-2">Check your mail!</h2>
        <p className="text-sm text-zinc-400 mb-6">
          We have sent a 6-digit code to <span className="text-white font-medium">johndoe45@gmail.com</span>. Please input it in the field below
        </p>

        <div className="flex justify-center gap-2 mb-6">
          {inputs.map((ref, index) => (
            <input
              key={index}
              ref={ref}
              maxLength={1}
              className="w-10 h-12 text-center text-lg bg-zinc-800 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              onChange={(e) => handleInput(e, index)}
            />
          ))}
        </div>

        <button 
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded text-sm"
          onClick={() => {
        handleVerification
          }}
          >
          Verify my email
        </button>

        <p className="text-sm text-zinc-500 mt-4">
          Didn't get a code?{' '}
          <a href="#" className="text-purple-400 underline">
            Resend Code
          </a>
        </p>
      </div>
    </div>
  );
}
