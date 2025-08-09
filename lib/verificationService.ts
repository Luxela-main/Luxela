class VerificationService {
  private verificationCodes = new Map<
    string,
    { code: string; expiresAt: Date }
  >();

  generateCode(email: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Set expiration time
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    this.verificationCodes.set(email, { code, expiresAt });
    return code;
  }

  verifyCode(email: string, code: string): boolean {
    const record = this.verificationCodes.get(email);
    if (!record) return false;

    // Check if code matches and isn't expired
    return record.code === code && new Date() < record.expiresAt;
  }

  removeCode(email: string) {
    this.verificationCodes.delete(email);
  }
}

export const verificationService = new VerificationService();
