"use client";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_BASE_URL || "https://luxela-3s8u.onrender.com";

export default function GoogleSignInButton() {
  const handleSignIn = async () => {
    const redirect = `${window.location.origin}/auth/callback`;
    window.location.href = `${AUTH_BASE_URL}/api/auth/google?redirect=${encodeURIComponent(redirect)}`;
  };

  return (
    <button
      className="w-full flex items-center justify-center gap-3 bg-zinc-900 hover:bg-zinc-800 py-2 rounded text-sm"
      onClick={handleSignIn}
    >
      <img src="/google.svg" alt="Google" className="h-4 w-4" />
      Sign in with Google
    </button>
  );
}
