

export default function HeroSection() {
  return (
    <section
      id="hero"
      className="flex flex-col items-center justify-center text-center space-y-8 max-w-3xl min-h-[70vh] py-16"
    >
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-zinc-950 font-heading">
          Software <span className="text-blue-600">Developer</span>
        </h1>
        <p className="text-lg md:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed font-normal">
          Crafting scalable, high-performance web applications and intuitive
          digital experiences.
        </p>
      </div>
    </section>
  );
}
