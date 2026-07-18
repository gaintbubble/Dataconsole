import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock authentication updated with your requested credentials
        if (credentials?.email === "centrallab@asram.com" && credentials?.password === "asram123") {
          return { 
            id: "1", 
            name: "Central Lab Admin", 
            email: "centrallab@asram.com", 
            role: "admin" 
          };
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: '/login', 
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "development-super-secret-key-123",
});

export { handler as GET, handler as POST };