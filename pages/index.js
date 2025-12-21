import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center px-4">
      <img
        src="/elora-logo.svg"
        alt="Elora Logo"
        className="w-16 h-16 mb-4"
      />
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Elora</h1>
      <p className="text-sm text-gray-600 mb-6">Your AI Teaching Assistant • 2026</p>

      <Link href="/verify">
        <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition">
          Go to Verification Page
        </button>
      </Link>

      <footer className="mt-10 text-xs text-gray-400">&copy; 2026 Elora. All rights reserved.</footer>
    </div>
  );
}
