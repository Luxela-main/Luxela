    "use client";

    import { useState } from "react";

    type AuthError = string | null;

    class AuthService {
    private baseUrl = "https://auth-backend-kx7l.onrender.com/api/auth";

    async signUp(email: string, password: string): Promise<string> {
        const url = `${this.baseUrl}/signup`;
        const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signup failed");
        }

        const data = await response.json();
        return data.uid;
    }

    async signIn(email: string, password: string): Promise<{ uid: string; token: string }> {
        const url = `${this.baseUrl}/signin`;
        const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Signin failed");
        }

        const data = await response.json();
        return { uid: data.uid, token: data.token };
    }

    async verifyToken(firebaseIdToken: string): Promise<string> {
        const url = `${this.baseUrl}/verify-token`;
        const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${firebaseIdToken}`,
        },
        });

        if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Token verification failed");
        }

        const data = await response.json();
        return data.uid;
    }
    }

    const authService = new AuthService();

    export function useSignUp() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AuthError>(null);
    const [uid, setUid] = useState<string | null>(null);

    async function signUp(email: string, password: string) {
        setLoading(true);
        setError(null);

        try {
        const newUid = await authService.signUp(email, password);
        setUid(newUid);
        } catch (err: any) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    }

    return { signUp, loading, error, uid };
    }

    export function useSignIn() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function signIn(email: string, password: string) {
    setLoading(true);
    setError(null);

    try {
      const { uid: userUid, token: userToken } = await authService.signIn(email, password);
      setUid(userUid);
      setToken(userToken);
      // Save token to localStorage/sessionStorage
      localStorage.setItem("authToken", userToken);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { signIn, loading, error, uid, token };
}


    export function useVerifyToken() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<AuthError>(null);
    const [uid, setUid] = useState<string | null>(null);

    async function verifyToken(token: string) {
        setLoading(true);
        setError(null);

        try {
        const verifiedUid = await authService.verifyToken(token);
        setUid(verifiedUid);
        } catch (err: any) {
        setError(err.message);
        } finally {
        setLoading(false);
        }
    }

    return { verifyToken, loading, error, uid };
    }
