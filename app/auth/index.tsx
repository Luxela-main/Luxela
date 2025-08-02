"use client";

import { useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  getIdToken
} from "firebase/auth";
import { auth } from "@/lib/firebase";

type AuthError = string | null;

class AuthService {
  private baseUrl = "https://auth-backend-kx7l.onrender.com/api/auth";
  private userBaseUrl = "https://auth-backend-kx7l.onrender.com/api/user";

  async signUp(email: string, password: string): Promise<string> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user.uid;
    } catch (error: any) {
      throw new Error(error.message || "Firebase signup failed");
    }
  }

  async signIn(email: string, password: string): Promise<{ uid: string; token: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await getIdToken(userCredential.user);
      return { uid: userCredential.user.uid, token };
    } catch (error: any) {
      throw new Error(error.message || "Firebase signin failed");
    }
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

  async addUserData(data: any, token: string): Promise<{ id: string }> {
    const response = await fetch(`${this.userBaseUrl}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Add user data failed");
    }

    return await response.json();
  }

  async getAllUserData(token: string): Promise<any[]> {
    const response = await fetch(`${this.userBaseUrl}/get`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Get user data failed");
    }

    return await response.json();
  }

  async updateUserData(id: string, update: any, token: string): Promise<{ message: string }> {
    const response = await fetch(`${this.userBaseUrl}/update`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, ...update }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Update failed");
    }

    return await response.json();
  }

  async deleteUserData(id: string, token: string): Promise<{ message: string }> {
    const response = await fetch(`${this.userBaseUrl}/delete`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Delete failed");
    }

    return await response.json();
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

  async function signIn(email: string, password: string): Promise<{ uid: string; token: string }> {
    setLoading(true);
    setError(null);

    try {
      const { uid: userUid, token: userToken } = await authService.signIn(email, password);
      setUid(userUid);
      setToken(userToken);
      localStorage.setItem("authToken", userToken);
      return { uid: userUid, token: userToken };
    } catch (err: any) {
      setError(err.message);
      throw err;
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

export function useAddUserData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);
  const [id, setId] = useState<string | null>(null);

  async function addUserData(data: any, token: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await authService.addUserData(data, token);
      setId(res.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { addUserData, loading, error, id };
}

export function useGetAllUserData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);
  const [data, setData] = useState<any[]>([]);

  async function getAllUserData(token: string) {
    setLoading(true);
    setError(null);

    try {
      const allData = await authService.getAllUserData(token);
      setData(allData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { getAllUserData, loading, error, data };
}

export function useUpdateUserData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function updateUserData(id: string, update: any, token: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await authService.updateUserData(id, update, token);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { updateUserData, loading, error, message };
}

export function useDeleteUserData() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AuthError>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function deleteUserData(id: string, token: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await authService.deleteUserData(id, token);
      setMessage(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return { deleteUserData, loading, error, message };
}
