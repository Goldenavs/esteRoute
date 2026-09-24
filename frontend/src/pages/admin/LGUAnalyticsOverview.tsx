import { Link } from 'react-router-dom'

export default function LGUAnalyticsOverview() { 
  return (
    <div className="w-full">
      
      <div className="w-full">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-surface border border-border-subtle text-text-primary p-6 rounded shadow-md border-t-4 border-indigo-500 h-48 flex items-center justify-center text-text-secondary">
            [Average Blockage Severity Chart]
          </div>
          <div className="bg-surface border border-border-subtle text-text-primary p-6 rounded shadow-md border-t-4 border-indigo-500 h-48 flex items-center justify-center text-text-secondary">
            [Total Reports Triaged]
          </div>
          <div className="bg-surface border border-border-subtle text-text-primary p-6 rounded shadow-md border-t-4 border-indigo-500 h-48 flex items-center justify-center text-text-secondary">
            [Clearance Turnaround Times]
          </div>
        </div>
      </div>
    </div>
  )
}
