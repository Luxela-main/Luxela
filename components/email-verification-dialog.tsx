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
import { Mail, CheckCircle, AlertCircle } from "lucide-react";

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
            Verify your email
          </DialogTitle>
          <DialogDescription className="text-center">
            We've sent a verification link to:
            <u className="font-semibold text-foreground mt-2"> {userEmail}</u>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Main instruction box */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">Next steps:</p>
            <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">1.</span>
                <span>Open the email we just sent to <strong>{userEmail}</strong></span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">2.</span>
                <span>Click the <strong>"Verify your email"</strong> button or link</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold flex-shrink-0">3.</span>
                <span>You'll be automatically redirected to complete your registration</span>
              </li>
            </ol>
          </div>
          
          {/* Additional info */}
          <div className="space-y-2">
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <p>The link expires in <strong>1 hour</strong> for security</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
              <p>Can't find it? Check your <strong>spam</strong> or <strong>junk</strong> folder</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            onClick={handleResendVerification}
            disabled={isResending}
            variant="outline"
            className="w-full"
          >
            {isResending ? "Resending..." : "Resend email"}
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