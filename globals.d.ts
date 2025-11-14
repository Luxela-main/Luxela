import { HelpCircle, ArrowLeft } from "lucide-react/dist/esm";
declare global {
  interface Window {
    HelpCircle: typeof HelpCircle;
    ArrowLeft: typeof ArrowLeft;
  }
}
export {};
    if (!res.ok) throw new Error(data?.message || "Resend verification failed");