'use client';

// Kök layout'un kendisi çökerse (ThemeProvider, font yüklemesi vb.) error.tsx
// hiç render edilemez — bu dosya kendi <html>/<body>'sini kurar. Tema
// değişkenleri de yüklenmemiş olabileceğinden renkler burada satır içidir.
export default function GlobalError({ error, reset }: {
  error: Error & { digest?: string }; reset: () => void;
}) {
  return (
    <html lang="tr">
      <body style={{
        margin: 0, minHeight: '100dvh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', backgroundColor: '#f5f0e4', color: '#182742',
        fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Harfiyen Açılamadı</h1>
          <p style={{ marginTop: '0.75rem', fontSize: '0.9rem', opacity: 0.75 }}>
            Beklenmedik bir hata oldu. Sayfayı yenilemeyi dene.
          </p>
          <button type="button" onClick={reset} style={{
            marginTop: '1.25rem', minHeight: '2.75rem', padding: '0 1.25rem',
            borderRadius: '0.75rem', border: 'none', backgroundColor: '#182742',
            color: '#f5f0e4', fontWeight: 600, cursor: 'pointer',
          }}>
            Tekrar Dene
          </button>
          {error.digest && (
            <p style={{ marginTop: '1.5rem', fontSize: '0.7rem', opacity: 0.6 }}>
              hata kodu: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
