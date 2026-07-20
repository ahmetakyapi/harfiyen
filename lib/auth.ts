import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getDb } from './db';
import { checkCredentials } from './register';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Oturum çerezi 90 gün geçerli ve her ziyarette yenilenir (updateAge): aktif
  // bir kullanıcı pratikte hiç yeniden giriş yapmak zorunda kalmaz. E-postasız
  // hesap modelinde "sürekli giriş" en büyük sürtünmeydi — çerez kalıcı, tarayıcı
  // kapansa da kalır. trustHost: Vercel arkasında host doğrulaması için gerekli.
  trustHost: true,
  session: {
    strategy: 'jwt',
    maxAge: 90 * 24 * 60 * 60, // 90 gün
    updateAge: 24 * 60 * 60,   // günde bir token'ı tazele (kayan pencere)
  },
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
