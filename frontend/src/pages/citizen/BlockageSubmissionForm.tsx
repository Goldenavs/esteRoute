import { Link } from 'react-router-dom'

export default function BlockageSubmissionForm() { 
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-2xl font-bold">esteRoute</h1>
        <div className="space-x-4">
          <Link to="/public-map" className="hover:underline font-medium">Public Map</Link>
          <Link to="/login" className="bg-white text-blue-700 px-4 py-2 rounded font-semibold hover:bg-gray-100 transition-colors">
            Sign In / LGU Access
          </Link>
        </div>
      </header>
      
      <main className="flex-1 p-6 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Report a Blockage</h2>
          <p className="text-gray-600 mb-6">Take a photo of the clogged estero to help us prioritize clearing efforts before the next heavy rain.</p>
          <div className="border-2 border-dashed border-gray-300 p-12 rounded-lg mb-4 text-gray-500">
            [Camera / Upload Area Placeholder]
          </div>
          <Link to="/confirmation" className="block w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition-colors">
            Submit Report
          </Link>
        </div>
      </main>
    </div>
  )
}
