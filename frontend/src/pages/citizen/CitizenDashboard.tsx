import { Link } from 'react-router-dom'

export default function CitizenDashboard() { 
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-green-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Citizen Dashboard (My Reports)</h1>
        <Link to="/" className="bg-white text-green-700 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">
          Log Out
        </Link>
      </header>
      <main className="flex-1 p-8">
        <h2 className="text-2xl font-bold mb-4">Your Past Submissions</h2>
        <div className="bg-white p-6 rounded shadow-md border-t-4 border-green-500">
          <p className="text-gray-500 italic">No reports submitted yet, or fetch data here.</p>
        </div>
      </main>
    </div>
  )
}
