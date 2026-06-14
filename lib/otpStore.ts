// Global in-memory storage for registration OTP drafts
export interface RegistrationDraft {
  name: string
  otp: string
  expires: Date
  address?: string
}

if (!(global as any).registerOtps) {
  (global as any).registerOtps = new Map<string, RegistrationDraft>()
}

export const registerOtps: Map<string, RegistrationDraft> = (global as any).registerOtps
