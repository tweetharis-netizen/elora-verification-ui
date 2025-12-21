export default function VerifyPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9fafb] text-gray-800 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center border border-gray-200">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
        <p className="text-sm mb-4">
          Your email has been successfully verified. You may now proceed to use Elora.
        </p>
        <a
          href="/"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-full transition"
        >
          Return Home
        </a>
      </div>
      <footer className="text-xs text-gray-400 mt-8">
        &copy; {new Date().getFullYear()} Elora • Empowering Teachers
      </footer>
    </div>
  );
}
