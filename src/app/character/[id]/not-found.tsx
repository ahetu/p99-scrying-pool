import Link from "next/link";

export default function CharacterNotFound() {
  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4 opacity-30">
          &#x1F52E;
        </div>
        <h1 className="text-2xl font-bold text-amber-200 mb-2">
          Character Not Found
        </h1>
        <p className="text-zinc-400 text-sm mb-6 max-w-md">
          The scrying pool reveals nothing at this location.
          This character may not exist or the link may be incorrect.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-amber-800/40 border border-amber-700/40 rounded-lg text-amber-200 text-sm hover:bg-amber-800/60 transition-colors"
        >
          Return to the Pool
        </Link>
      </div>
    </div>
  );
}
