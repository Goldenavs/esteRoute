import { Link } from 'react-router-dom'

export default function HistoricalArchiveView() { 
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-slate-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Historical Archive View</h1>
        <Link to="/admin-dashboard" className="hover:underline font-medium">&larr; Back to Command Dashboard</Link>
      </header>
      <main className="flex-1 p-8">
        <div className="bg-white p-6 rounded shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">Resolved & Failed Reports</h2>
          <div className="h-64 flex items-center justify-center text-gray-500 italic">
            [Paginated Data Table Placeholder]
          </div>
        </div>
      </main>
    </div>
  )
}
