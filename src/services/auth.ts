import type { UserSession } from "../types";

export interface AuthProvider {
  id: string;
  label: string;
  signIn(): Promise<UserSession>;
  signOut(session: UserSession): Promise<UserSession>;
}

export class MockAuthProvider implements AuthProvider {
  id = "mock-auth";
  label = "Walker account";

  async signIn(): Promise<UserSession> {
    const now = new Date().toISOString();

    return {
      userId: "user-demo-001",
      displayName: "Sam Rivera",
      email: "sam@example.com",
      status: "signed_in",
      createdAt: now,
      updatedAt: now
    };
  }

  async signOut(session: UserSession): Promise<UserSession> {
    return {
      ...session,
      status: "signed_out",
      updatedAt: new Date().toISOString()
    };
  }
}

export const authProvider = new MockAuthProvider();
