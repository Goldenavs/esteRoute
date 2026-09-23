import { Link } from 'react-router-dom'

export default function LGUAnalyticsOverview() { 
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-indigo-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">LGU Analytics Overview</h1>
        <Link to="/admin-dashboard" className="hover:underline font-medium">&larr; Back to Command Dashboard</Link>
      </header>
      <main className="flex-1 p-8">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded shadow-md border-t-4 border-indigo-500 h-48 flex items-center justify-center text-gray-500">
            [Average Blockage Severity Chart]
          </div>
          <div className="bg-white p-6 rounded shadow-md border-t-4 border-indigo-500 h-48 flex items-center justify-center text-gray-500">
            [Total Reports Triaged]
          </div>
          <div className="bg-white p-6 rounded shadow-md border-t-4 border-indigo-500 h-48 flex items-center justify-center text-gray-500">
            [Clearance Turnaround Times]
          </div>
        </div>
      </main>
    </div>
  )
}
