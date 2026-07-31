import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/app/lib/prisma";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Placeholder login logic
        if (credentials?.username === "admin" && credentials?.password === "password") {
          // We added the 'role' property here to satisfy your custom type definitions
          return { 
            id: "1", 
            name: "Admin User", 
            email: "admin@labseven.com",
            role: "admin" 
          };
        }
        return null;
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    // signIn: '/login', 
  },
});

export { handler as GET, handler as POST };