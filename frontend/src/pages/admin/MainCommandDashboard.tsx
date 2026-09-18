import { Link } from 'react-router-dom'

export default function MainCommandDashboard() { 
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-indigo-800 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">LGU Dispatcher Command Dashboard</h1>
        <div className="space-x-4">
          <Link to="/analytics" className="hover:underline font-medium">Analytics</Link>
          <Link to="/archive" className="hover:underline font-medium">Archive</Link>
          <Link to="/" className="bg-white text-indigo-800 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">
            Log Out
          </Link>
        </div>
      </header>
      <main className="flex-1 flex p-4 gap-4">
        <div className="flex-1 bg-gray-200 rounded flex items-center justify-center text-gray-500 border border-gray-300">
          [Interactive Priority Map]
        </div>
        <div className="w-1/3 bg-white rounded shadow-md p-4 flex flex-col">
          <h2 className="font-bold text-lg mb-4 border-b pb-2">Priority Dispatch Queue</h2>
          <div className="flex-1 text-gray-500 text-center mt-10 italic">
            [Queue Data Table]
          </div>
        </div>
      </main>
    </div>
  )
}
