import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.NEXT_PUBLIC_GOOGLE_ID || '',
      clientSecret: process.env.NEXT_PUBLIC_GOOGLE_PW || '',
    }),
  ],
};

export default NextAuth(authOptions);
