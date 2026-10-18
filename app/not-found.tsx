import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 bg-white">
      <div className="text-center max-w-lg space-y-6">
        {/* Badge */}
        <span className="text-xs uppercase tracking-widest text-[#1D4ED8] font-bold px-3 py-1 rounded-full bg-blue-50 border border-blue-100 inline-block">
          Error 404
        </span>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-zinc-950 font-heading tracking-tight">
            Page <span className="text-[#1D4ED8]">Not Found</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 font-normal">
            The page you are looking for doesn&apos;t exist, has been moved, or the URL was entered incorrectly.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="btn-primary !py-3 !px-6 !rounded-xl !font-semibold shadow-sm"
          >
            ← Back to Home
          </Link>
          <Link
            href="/projects"
            className="btn-secondary !py-3 !px-6 !rounded-xl !font-semibold"
          >
            View Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
