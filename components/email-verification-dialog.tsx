import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogOverlay
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";

interface EmailVerificationDialogProps {
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
  userEmail: string;
  handleResendVerification: () => void;
  isResending: boolean;
}

export function EmailVerificationDialog({
  dialogOpen,
  setDialogOpen,
  userEmail,
  handleResendVerification,
  isResending,
}: EmailVerificationDialogProps) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogOverlay />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-purple-100 p-3">
              <Mail className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <DialogTitle className="text-center">
            Check your email
          </DialogTitle>
          <DialogDescription className="text-center">
            We've sent a verification link to:
            <span className="font-semibold text-foreground mt-2">{userEmail}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Click the verification link in the email to activate your account</p>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p>The link will expire in 24 hours</p>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p>Check your spam folder if you don't see it</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleResendVerification}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? "Resending..." : "Resend verification email"}
          </Button>
          <Button
            onClick={() => setDialogOpen(false)}
            className="w-full bg-gradient-to-b from-purple-600 to-purple-400"
          >
            Got it
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}