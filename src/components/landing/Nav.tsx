import Image from "next/image";

export function Nav() {
  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-ni-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
        <Image
          src="/logo.png"
          alt="Northside Intelligence"
          width={40}
          height={40}
          className="h-10 w-10 object-contain"
          priority
        />
      </div>
    </header>
  );
}
