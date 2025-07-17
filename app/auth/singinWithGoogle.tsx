// auth/index.ts
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useToast } from "@/components/hooks/useToast";
import { useAddUserData } from ".";
import { useRouter } from "next/navigation";

export function useGoogleAuth() {
  const auth = getAuth();
  const provider = new GoogleAuthProvider();
  const { addUserData } = useAddUserData();
  const toast = useToast();
  const router = useRouter();

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const token = await user.getIdToken();
      await addUserData({ uid: user.uid, email: user.email }, token);

      toast.success("Signed in successfully!");
      router.push("/");
    } catch (error: any) {
      toast.error(error.message || "Google sign-in failed");
    }
  };

  return { signInWithGoogle };
}
