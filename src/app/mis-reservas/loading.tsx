export default function MisReservasLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-r from-brand-900 to-brand-700 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-40 bg-white/20 rounded-lg animate-pulse mb-2" />
          <div className="h-4 w-56 bg-white/10 rounded animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-64 bg-gray-200 rounded" />
                  <div className="h-4 w-48 bg-gray-100 rounded" />
                  <div className="h-4 w-40 bg-gray-100 rounded" />
                  <div className="flex gap-3">
                    <div className="h-5 w-20 bg-gray-200 rounded" />
                    <div className="h-5 w-16 bg-gray-200 rounded" />
                    <div className="h-5 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="h-10 w-28 bg-gray-200 rounded-lg self-start" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
