// Açılış perdesi: "HARFİYEN" bir bulmaca kelimesi gibi hücrelere yazılır,
// doğru çözülmüş kelime gibi yeşile döner ve perde yukarı çekilir. Tamamı CSS
// (globals.css → .intro); burada yalnızca işaretleme var.
//
// Kimin göreceğine <head>deki satır içi betik karar verir (INTRO_SCRIPT):
// oturum başına bir kez, /play dışında, hareket azaltma istenmemişse. Betik
// `intro-playing` sınıfını ekleyip perdeyi görünür yapar; sınıf, sayfa içi
// girişlerin hepsi bittikten sonra kaldırılır (bkz. --intro-delay).
const WORD = ['H', 'A', 'R', 'F', 'İ', 'Y', 'E', 'N'];

export const INTRO_SCRIPT = `(function(){try{
var d=document.documentElement,k='harfiyen:intro';
if(sessionStorage.getItem(k)||location.pathname.indexOf('/play/')===0||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
sessionStorage.setItem(k,'1');d.classList.add('intro-playing');
setTimeout(function(){d.classList.remove('intro-playing')},3600);
}catch(e){}})();`;

export function Intro() {
  return (
    <div className="intro" aria-hidden>
      <div className="intro-word">
        {WORD.map((ch, i) => (
          <span key={i} className="intro-cell" data-no={i === 0 ? '1' : undefined}
            style={{ '--i': i } as React.CSSProperties}>
            <span>{ch}</span>
          </span>
        ))}
      </div>
      <p className="intro-clue">1 soldan sağa · Her gün üç yeni bulmaca</p>
    </div>
  );
}
