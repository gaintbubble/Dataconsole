import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

// 1. Extend the built-in session/user models
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string // Add your custom role here
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
  }
}

// 2. Extend the built-in JWT model
declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}