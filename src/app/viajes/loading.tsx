export default function ViajesLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="bg-gradient-to-r from-brand-800 to-accent-700 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-56 bg-white/20 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-40 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded" />
                  <div className="h-3 w-4 bg-gray-100 rounded ml-5" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-7 w-20 bg-gray-200 rounded ml-auto" />
                  <div className="h-3 w-16 bg-gray-100 rounded ml-auto" />
                </div>
              </div>
              <div className="py-3 border-y border-gray-100 mb-4 flex gap-4">
                <div className="h-10 w-24 bg-gray-200 rounded" />
                <div className="flex-1" />
                <div className="h-4 w-28 bg-gray-100 rounded self-center" />
              </div>
              <div className="h-4 w-36 bg-gray-100 rounded mb-4" />
              <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
              <div className="h-11 w-full bg-gray-200 rounded-lg mt-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
