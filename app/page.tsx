import Image from "next/image";
import { CLOUDINARY_URLS } from "./assets";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-6 flex flex-col items-center">
        {/* Notice: since the logo is white text/artwork, we provide a dark accent container or background so it's clearly visible in light mode */}
        <div className="bg-zinc-950 p-4 rounded-2xl shadow-sm flex items-center justify-center">
          <Image
            src={CLOUDINARY_URLS.logo}
            alt="Logo"
            width={180}
            height={50}
            className="h-10 w-auto object-cover object-center pointer-events-none select-none"
            priority
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Portfolio</h1>
          <p className="text-zinc-500">Ready for frontend development.</p>
        </div>
      </div>
    </main>
  );
}
