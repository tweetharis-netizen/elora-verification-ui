// 📁 pages/index.js
export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">Welcome to Elora</h1>
        <p className="text-gray-600">Your AI Teaching Assistant</p>
        <a
          href="/verify"
          className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
        >
          Go to Email Verification
        </a>
      </div>
    </div>
  );
}
