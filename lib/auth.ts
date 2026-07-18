import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getDb } from './db';
import { checkCredentials } from './register';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      authorize: async (creds) => {
        const username = String(creds?.username ?? '').toLocaleLowerCase('tr-TR');
        const password = String(creds?.password ?? '');
        const user = await checkCredentials(getDb(), username, password);
        return user ? { id: String(user.id), name: user.username } : null;
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user?.id) token.uid = user.id;
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = String(token.uid);
      return session;
    },
  },
});

export async function currentUserId(): Promise<number | null> {
  const session = await auth();
  const id = Number(session?.user?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}
