import { Link } from 'react-router-dom'

export default function BlockageSubmissionForm() { 
  return (
    <div className="w-full">
      
      
      <div className="w-full flex justify-center">
        <div className="bg-surface border border-border-subtle text-text-primary p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Report a Blockage</h2>
          <p className="text-gray-600 mb-6">Take a photo of the clogged estero to help us prioritize clearing efforts before the next heavy rain.</p>
          <div className="border-2 border-dashed border-gray-300 p-12 rounded-lg mb-4 text-text-secondary">
            [Camera / Upload Area Placeholder]
          </div>
          <Link to="/confirmation" className="block w-full bg-blue-600 text-white p-3 rounded font-bold hover:bg-blue-700 transition-colors">
            Submit Report
          </Link>
        </div>
      </div>
    </div>
  )
}
