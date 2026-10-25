import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto min-h-screen max-w-[560px] px-5 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Zomato Lite</h1>
      <p className="mt-2 text-sm text-stone-500">One restaurant. Real reviews.</p>
      <Link
        href="/restaurant/1"
        className="mt-8 inline-flex rounded-lg bg-[#b45309] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#8f4007]"
      >
        Open Ludhiana Burrito
      </Link>
    </main>
  );
}
