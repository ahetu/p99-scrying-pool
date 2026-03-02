import UploadForm from "@/components/UploadForm";
import RecentCharacters from "@/components/RecentCharacters";

function GeoCircle({ size, speed, reverse, opacity = 0.1, className = "" }: {
  size: number;
  speed: number;
  reverse?: boolean;
  opacity?: number;
  className?: string;
}) {
  const ticks = Math.max(12, Math.round(size / 8));
  const anim = reverse
    ? `spin-slow-reverse ${speed}s linear infinite`
    : `spin-slow ${speed}s linear infinite`;

  return (
    <svg
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size, animation: anim, opacity }}
      viewBox="0 0 200 200"
      fill="none"
    >
      <circle cx="100" cy="100" r="97" stroke="rgba(217,160,50,0.5)" strokeWidth="0.4" />
      <circle cx="100" cy="100" r="90" stroke="rgba(217,160,50,0.3)" strokeWidth="0.3" strokeDasharray="3 6" />
      {/* Tick marks */}
      {Array.from({ length: ticks }).map((_, i) => {
        const angle = (i * (360 / ticks) * Math.PI) / 180;
        const long = i % Math.round(ticks / 4) === 0;
        const r1 = long ? 87 : 93;
        return (
          <line
            key={`t${i}`}
            x1={100 + r1 * Math.cos(angle)}
            y1={100 + r1 * Math.sin(angle)}
            x2={100 + 97 * Math.cos(angle)}
            y2={100 + 97 * Math.sin(angle)}
            stroke="rgba(217,160,50,0.5)"
            strokeWidth={long ? "0.6" : "0.3"}
          />
        );
      })}
      {/* Cardinal diamonds */}
      {[0, 90, 180, 270].map((deg) => {
        const a = (deg * Math.PI) / 180;
        const cx = 100 + 94 * Math.cos(a);
        const cy = 100 + 94 * Math.sin(a);
        return (
          <polygon
            key={`d${deg}`}
            points={`${cx},${cy - 3} ${cx + 2},${cy} ${cx},${cy + 3} ${cx - 2},${cy}`}
            fill="rgba(217,160,50,0.5)"
          />
        );
      })}
      {/* Star geometry */}
      <polygon
        points="50,8 58,38 88,38 64,56 72,86 50,68 28,86 36,56 12,38 42,38"
        transform="translate(50,50) scale(0.9) translate(-50,-50)"
        stroke="rgba(217,160,50,0.3)"
        strokeWidth="0.3"
        fill="none"
      />
      {/* Crosshairs */}
      <line x1="100" y1="20" x2="100" y2="180" stroke="rgba(217,160,50,0.12)" strokeWidth="0.2" />
      <line x1="20" y1="100" x2="180" y2="100" stroke="rgba(217,160,50,0.12)" strokeWidth="0.2" />
    </svg>
  );
}

function GeoStar({ size, points = 5, opacity = 0.1, className = "" }: {
  size: number;
  points?: number;
  opacity?: number;
  className?: string;
}) {

  const cx = 100, cy = 100;
  const outerR = 90;
  const innerR = points <= 3 ? 35 : points === 4 ? 30 : points <= 6 ? 40 : 45;
  const starPoints: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    starPoints.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }

  return (
    <svg
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size, opacity }}
      viewBox="0 0 200 200"
      fill="none"
    >
      <polygon
        points={starPoints.join(" ")}
        stroke="rgba(217,160,50,0.6)"
        strokeWidth="0.5"
        fill="none"
      />
      <polygon
        points={starPoints.join(" ")}
        stroke="rgba(217,160,50,0.25)"
        strokeWidth="0.3"
        fill="none"
        transform={`rotate(${180 / points} 100 100) scale(0.65) translate(${100 * (1 - 0.65) / 0.65} ${100 * (1 - 0.65) / 0.65})`}
      />
      <circle cx="100" cy="100" r="3" fill="rgba(217,160,50,0.5)" />
    </svg>
  );
}

function GeoMoon({ size, opacity = 0.2, className = "" }: {
  size: number;
  opacity?: number;
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none ${className}`}
      style={{ width: size, height: size, opacity }}
      viewBox="0 0 200 200"
      fill="none"
    >
      <defs>
        <mask id="moon-mask">
          <rect width="200" height="200" fill="white" />
          <circle cx="130" cy="85" r="65" fill="black" />
        </mask>
      </defs>
      <circle cx="100" cy="100" r="75" fill="rgba(217,160,50,0.15)" mask="url(#moon-mask)" />
      <circle cx="100" cy="100" r="75" stroke="rgba(217,160,50,0.5)" strokeWidth="0.6" mask="url(#moon-mask)" />
      <circle cx="100" cy="100" r="80" stroke="rgba(217,160,50,0.15)" strokeWidth="0.3" strokeDasharray="2 5" />
    </svg>
  );
}

function SectionDivider() {
  return (
    <div className="flex items-center justify-center gap-4 my-2">
      <div className="h-px flex-1 max-w-32 bg-gradient-to-r from-transparent to-amber-700/20" />
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-30">
        <polygon points="6,0 12,6 6,12 0,6" fill="rgba(217,160,50,1)" />
      </svg>
      <div className="h-px flex-1 max-w-32 bg-gradient-to-l from-transparent to-amber-700/20" />
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Background geometry layer — header region only */}
      <div className="absolute inset-x-0 top-0 h-[420px] pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-900/15 via-amber-950/5 via-30% to-transparent to-50%" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-amber-600/6 rounded-full blur-3xl" />

          {/* Circles */}
          <div className="absolute -top-8 left-[2%]">
            <GeoCircle size={320} speed={180} opacity={0.24} />
          </div>
          <div className="absolute -top-12 left-[38%]">
            <GeoCircle size={200} speed={140} reverse opacity={0.2} />
          </div>
          <div className="absolute -top-6 right-[0%]">
            <GeoCircle size={350} speed={160} opacity={0.22} />
          </div>
          <div className="absolute top-[140px] left-[-3%]">
            <GeoCircle size={180} speed={130} reverse opacity={0.18} />
          </div>
          <div className="absolute top-[160px] left-[42%]">
            <GeoCircle size={240} speed={150} opacity={0.2} />
          </div>
          <div className="absolute top-[130px] right-[5%]">
            <GeoCircle size={160} speed={120} reverse opacity={0.18} />
          </div>

          {/* Moon — upper right, toned down */}
          <div className="absolute top-6 right-[12%]">
            <GeoMoon size={160} opacity={0.18} />
          </div>

          {/* Stars — large */}
          <div className="absolute top-4 left-[18%]">
            <GeoStar size={90} points={5} opacity={0.5} />
          </div>
          <div className="absolute top-[120px] left-[8%]">
            <GeoStar size={85} points={4} opacity={0.5} />
          </div>
          <div className="absolute top-[170px] right-[18%]">
            <GeoStar size={80} points={5} opacity={0.45} />
          </div>

          {/* Stars — medium */}
          <div className="absolute top-8 left-[50%] -translate-x-1/2">
            <GeoStar size={60} points={4} opacity={0.45} />
          </div>
          <div className="absolute top-6 right-[30%]">
            <GeoStar size={55} points={5} opacity={0.42} />
          </div>
          <div className="absolute top-[100px] left-[28%]">
            <GeoStar size={50} points={4} opacity={0.4} />
          </div>
          <div className="absolute top-[200px] right-[38%]">
            <GeoStar size={55} points={5} opacity={0.42} />
          </div>
          <div className="absolute top-[180px] left-[15%]">
            <GeoStar size={50} points={4} opacity={0.4} />
          </div>

          {/* Stars — small */}
          <div className="absolute top-[30px] left-[35%]">
            <GeoStar size={30} points={4} opacity={0.38} />
          </div>
          <div className="absolute top-[70px] right-[8%]">
            <GeoStar size={35} points={5} opacity={0.35} />
          </div>
          <div className="absolute top-[90px] left-[5%]">
            <GeoStar size={28} points={4} opacity={0.35} />
          </div>
          <div className="absolute top-[150px] right-[28%]">
            <GeoStar size={32} points={5} opacity={0.33} />
          </div>
          <div className="absolute top-[220px] left-[42%]">
            <GeoStar size={35} points={4} opacity={0.35} />
          </div>
          <div className="absolute top-[60px] left-[60%]">
            <GeoStar size={25} points={5} opacity={0.32} />
          </div>
          <div className="absolute top-[250px] right-[10%]">
            <GeoStar size={30} points={4} opacity={0.33} />
          </div>
          <div className="absolute top-[260px] left-[12%]">
            <GeoStar size={28} points={5} opacity={0.3} />
          </div>

          {/* Stars — small, various shapes */}
          <div className="absolute top-[30px] left-[70%]">
            <GeoStar size={32} points={6} opacity={0.35} />
          </div>
          <div className="absolute top-[110px] left-[48%]">
            <GeoStar size={28} points={3} opacity={0.33} />
          </div>
          <div className="absolute top-[80px] left-[22%]">
            <GeoStar size={22} points={8} opacity={0.3} />
          </div>
          <div className="absolute top-[190px] right-[8%]">
            <GeoStar size={35} points={6} opacity={0.35} />
          </div>
          <div className="absolute top-[240px] left-[55%]">
            <GeoStar size={24} points={3} opacity={0.3} />
          </div>
          <div className="absolute top-[140px] left-[65%]">
            <GeoStar size={30} points={7} opacity={0.33} />
          </div>
          <div className="absolute top-[50px] left-[10%]">
            <GeoStar size={26} points={6} opacity={0.32} />
          </div>
          <div className="absolute top-[280px] left-[30%]">
            <GeoStar size={22} points={8} opacity={0.28} />
          </div>
          <div className="absolute top-[300px] right-[25%]">
            <GeoStar size={20} points={5} opacity={0.28} />
          </div>

          {/* Stars — tiny scattered fill */}
          <div className="absolute top-[15px] left-[55%]">
            <GeoStar size={16} points={4} opacity={0.3} />
          </div>
          <div className="absolute top-[45px] right-[15%]">
            <GeoStar size={18} points={6} opacity={0.28} />
          </div>
          <div className="absolute top-[65px] left-[40%]">
            <GeoStar size={14} points={3} opacity={0.26} />
          </div>
          <div className="absolute top-[95px] right-[42%]">
            <GeoStar size={20} points={8} opacity={0.3} />
          </div>
          <div className="absolute top-[130px] left-[3%]">
            <GeoStar size={18} points={5} opacity={0.28} />
          </div>
          <div className="absolute top-[160px] right-[3%]">
            <GeoStar size={16} points={7} opacity={0.28} />
          </div>
          <div className="absolute top-[175px] left-[38%]">
            <GeoStar size={14} points={4} opacity={0.26} />
          </div>
          <div className="absolute top-[210px] left-[72%]">
            <GeoStar size={22} points={6} opacity={0.3} />
          </div>
          <div className="absolute top-[230px] left-[8%]">
            <GeoStar size={18} points={3} opacity={0.28} />
          </div>
          <div className="absolute top-[255px] right-[42%]">
            <GeoStar size={16} points={8} opacity={0.26} />
          </div>
          <div className="absolute top-[270px] left-[62%]">
            <GeoStar size={14} points={5} opacity={0.25} />
          </div>
          <div className="absolute top-[290px] left-[18%]">
            <GeoStar size={20} points={7} opacity={0.28} />
          </div>
          <div className="absolute top-[310px] right-[15%]">
            <GeoStar size={16} points={6} opacity={0.25} />
          </div>
          <div className="absolute top-[40px] left-[82%]">
            <GeoStar size={12} points={4} opacity={0.25} />
          </div>
          <div className="absolute top-[105px] right-[20%]">
            <GeoStar size={15} points={3} opacity={0.26} />
          </div>
          <div className="absolute top-[155px] left-[52%]">
            <GeoStar size={13} points={5} opacity={0.24} />
          </div>
          <div className="absolute top-[200px] left-[25%]">
            <GeoStar size={17} points={8} opacity={0.27} />
          </div>
          <div className="absolute top-[320px] left-[45%]">
            <GeoStar size={15} points={6} opacity={0.24} />
          </div>
          <div className="absolute top-[85px] left-[75%]">
            <GeoStar size={11} points={4} opacity={0.24} />
          </div>
      </div>

      {/* Hero */}
      <header className="relative">
        <div className="relative max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
          {/* Orb with spinning geometry behind it */}
          <div className="relative inline-block mb-2 w-28 h-28 sm:w-32 sm:h-32">
            <GeoCircle size={128} speed={45} opacity={0.13} className="absolute inset-0 hidden sm:block" />
            <GeoCircle size={112} speed={45} opacity={0.13} className="absolute inset-0 sm:hidden" />
            <div className="absolute inset-[20%]">
              <GeoCircle size={80} speed={30} reverse opacity={0.08} className="hidden sm:block" />
              <GeoCircle size={68} speed={30} reverse opacity={0.08} className="sm:hidden" />
            </div>
            <div className="absolute inset-[-5%] rounded-full bg-amber-500/5 blur-2xl" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-5xl sm:text-6xl animate-[orb-breathe_5s_ease-in-out_infinite]"
                style={{ filter: 'drop-shadow(0 0 14px rgba(217,160,50,0.35)) drop-shadow(0 0 35px rgba(217,119,6,0.1))' }}
              >
                &#x1F52E;
              </span>
            </div>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-glow-gold">
            <span className="bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 bg-clip-text text-transparent">
              Naberial&apos;s
            </span>
            <br />
            <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">
              Scrying Pool
            </span>
          </h1>
          <p className="mt-5 text-zinc-400 max-w-lg mx-auto text-sm leading-relaxed">
            Peer into the pool and reveal the gear of any Project 1999 EverQuest
            character. Upload your inventory and share your profile with
            the world.
          </p>

        </div>
      </header>

      {/* Upload Section */}
      <main className="max-w-4xl mx-auto px-6 pb-24">
        <section className="mb-24 relative">
          <SectionDivider />
          <h2 className="text-amber-300/90 text-sm font-bold uppercase tracking-wider mb-8 text-center">
            Scry a Character
          </h2>
          <div className="card-fantasy rounded-2xl p-6 sm:p-10 glow-amber relative z-10">
            <UploadForm />
          </div>
        </section>

        {/* How it works */}
        <section className="mb-24 relative">
          <SectionDivider />
          <h2 className="text-amber-300/70 text-sm font-bold uppercase tracking-wider mb-8 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 relative z-10">
            <Step
              number="1"
              title="Export Your Inventory"
              description='Type /outputfile inventory in EverQuest. This creates a Character-Inventory.txt file in your EQ folder.'
            />
            <Step
              number="2"
              title="Upload & Fill Details"
              description="Upload the file, enter your character name, class, level, and race."
            />
            <Step
              number="3"
              title="Share Your Profile"
              description="Get a shareable link showing your full equipment, stats, and item tooltips."
            />
          </div>
        </section>

        {/* Recent Characters */}
        <section className="relative">
          <SectionDivider />
          <div className="relative z-10">
            <RecentCharacters />
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 text-center">
        <div>
          <div className="divider-ornate w-32 mx-auto mb-6" />
          <p className="text-zinc-600 text-xs">
            Naberial&apos;s Scrying Pool &mdash; A character viewer for Project 1999 EverQuest
          </p>
        </div>
      </footer>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="card-fantasy rounded-xl p-6 text-center group transition-all duration-300 hover:-translate-y-1">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600/30 to-amber-900/30 border border-amber-600/30 flex items-center justify-center mx-auto mb-4 group-hover:glow-amber transition-shadow">
        <span className="text-amber-400 text-sm font-bold">{number}</span>
      </div>
      <h3 className="text-amber-200 text-sm font-semibold mb-2">{title}</h3>
      <p className="text-zinc-500 text-xs leading-relaxed">{description}</p>
    </div>
  );
}
