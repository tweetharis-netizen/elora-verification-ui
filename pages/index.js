{const [selectedIntent, setSelectedIntent] = useState(null);
 /* Teacher Intent Selector */}
<div className="flex gap-2 mb-4 flex-wrap">
  {["Plan a lesson", "Explain a concept", "Create assessment", "Differentiate lesson"].map((intent) => (
    <button
      key={intent}
      onClick={() => setSelectedIntent(intent)}
      className={`px-4 py-2 rounded-full text-sm transition 
        ${selectedIntent === intent 
          ? "bg-indigo-600 text-white" 
          : "bg-gray-100 hover:bg-gray-200"}`}
    >
      {intent}
    </button>
  ))}
</div>
