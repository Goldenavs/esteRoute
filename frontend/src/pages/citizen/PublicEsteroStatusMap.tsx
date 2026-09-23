import { Link } from 'react-router-dom'

export default function PublicEsteroStatusMap() { 
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-blue-700 text-white p-4 flex justify-between items-center shadow-md">
        <h1 className="text-xl font-bold">Public Estero Status Map</h1>
        <Link to="/" className="hover:underline font-medium">&larr; Back to Submission Form</Link>
      </header>
      <main className="flex-1 bg-gray-200 flex items-center justify-center p-6">
        <div className="text-center text-gray-500">
          <p className="text-2xl mb-4">🌍</p>
          <p>[Interactive Leaflet Map Placeholder]</p>
        </div>
      </main>
    </div>
  )
}
