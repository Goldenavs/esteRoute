

export default function MainCommandDashboard() { 
  return (
    <div className="w-full">
      
      <div className="w-full">
        <div className="flex-1 bg-surface-subtle rounded flex items-center justify-center text-text-secondary border border-gray-300">
          [Interactive Priority Map]
        </div>
        <div className="w-1/3 bg-surface border border-border-subtle text-text-primary rounded shadow-md p-4 flex flex-col">
          <h2 className="font-bold text-lg mb-4 border-b pb-2">Priority Dispatch Queue</h2>
          <div className="flex-1 text-text-secondary text-center mt-10 italic">
            [Queue Data Table]
          </div>
        </div>
      </div>
    </div>
  )
}
