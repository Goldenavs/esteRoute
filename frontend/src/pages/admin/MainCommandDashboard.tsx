import { MapContainer, TileLayer, Marker, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AlertCircle, Clock, CheckCircle2, Navigation, ArrowRight, Filter, ShieldAlert, Truck, Info, MapPin } from 'lucide-react';

// Custom Map Marker Icon
const criticalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const activeIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export default function MainCommandDashboard() { 
  
  // Dummy Data for the Queue
  const dispatchQueue = [
    { id: 'RPT-8821', location: 'Estero de Paco, Pandacan', status: 'CRITICAL', time: '10 mins ago', type: 'Heavy Blockage', coords: [14.5878, 121.0023] },
    { id: 'RPT-8820', location: 'Estero de San Miguel', status: 'DISPATCHED', time: '45 mins ago', type: 'Flood Risk', coords: [14.5939, 120.9906] },
    { id: 'RPT-8819', location: 'Estero de Binondo', status: 'PENDING', time: '2 hours ago', type: 'Moderate Siltation', coords: [14.6000, 120.9750] },
    { id: 'RPT-8818', location: 'Estero de Quiapo', status: 'PENDING', time: '3 hours ago', type: 'Trash Build-up', coords: [14.5980, 120.9830] },
  ];

  return (
    <div className="w-full h-full flex flex-col pb-10">
      
      {/* Header section */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-5xl font-heading font-black tracking-tight text-text-primary mb-2 flex items-center gap-3">
            <ShieldAlert className="w-10 h-10 text-semantic-urgent" /> 
            Command Center
          </h1>
          <p className="text-text-muted text-sm md:text-lg">Real-time monitoring and dispatch coordination for city-wide waterways.</p>
        </div>
        
        {/* Quick Metrics */}
        <div className="flex gap-4">
          <div className="bg-semantic-urgent/10 border border-semantic-urgent/30 px-6 py-3 rounded-sm -skew-x-[6deg] shadow-lg">
            <div className="skew-x-[6deg] flex flex-col items-center">
              <span className="text-3xl font-black text-semantic-urgent">12</span>
              <span className="text-xs uppercase tracking-widest font-bold text-semantic-urgent/80">Critical</span>
            </div>
          </div>
          <div className="bg-semantic-warning/10 border border-semantic-warning/30 px-6 py-3 rounded-sm -skew-x-[6deg] shadow-lg">
            <div className="skew-x-[6deg] flex flex-col items-center">
              <span className="text-3xl font-black text-semantic-warning">8</span>
              <span className="text-xs uppercase tracking-widest font-bold text-semantic-warning/80">Active</span>
            </div>
          </div>
          <div className="bg-semantic-success/10 border border-semantic-success/30 px-6 py-3 rounded-sm -skew-x-[6deg] shadow-lg">
            <div className="skew-x-[6deg] flex flex-col items-center">
              <span className="text-3xl font-black text-semantic-success">45</span>
              <span className="text-xs uppercase tracking-widest font-bold text-semantic-success/80">Resolved</span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 flex-1 min-h-0">
        
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="w-full flex-1 min-h-[500px] bg-surface border border-border-strong rounded-sm relative overflow-hidden -skew-x-[2deg] shadow-xl group">
            <div className="absolute inset-0 bg-app-bg z-0 skew-x-[2deg] scale-110">
              
              <MapContainer 
                center={[14.5995, 120.9842]} 
                zoom={14} 
                zoomControl={false}
                className="w-full h-full z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="map-tiles"
                />
                <ZoomControl position="bottomright" />
                
                {/* Render markers from queue */}
                {dispatchQueue.map((item) => (
                  <Marker 
                    key={item.id} 
                    position={item.coords as [number, number]} 
                    icon={item.status === 'CRITICAL' ? criticalIcon : activeIcon}
                  >
                    <Popup className="custom-popup">
                      <div className="font-sans">
                        <h3 className="font-bold text-lg text-gray-900">{item.id}</h3>
                        <p className="text-sm font-semibold text-red-600 mb-1">{item.type}</p>
                        <p className="text-xs text-gray-600">{item.location}</p>
                        <button className="mt-3 w-full bg-brand-primary text-white text-xs font-bold py-2 rounded">
                          VIEW DETAILS
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

            </div>
            
            {/* Map UI Overlay */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none skew-x-[2deg]">
              <div className="bg-surface/90 backdrop-blur-md border border-border-strong p-3 rounded-sm shadow-lg pointer-events-auto flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div> Critical
                </div>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div> Dispatched
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dispatch Queue */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
          <div className="w-full bg-surface border border-border-strong rounded-sm shadow-xl flex flex-col h-full -skew-x-[2deg]">
            
            {/* Header */}
            <div className="p-4 border-b border-border-subtle bg-surface-subtle flex justify-between items-center skew-x-[2deg]">
              <h2 className="font-heading font-black text-lg flex items-center gap-2">
                <Navigation className="w-5 h-5 text-brand-primary" />
                Dispatch Queue
              </h2>
              <button className="p-1.5 hover:bg-surface rounded text-text-muted hover:text-brand-primary transition-colors">
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 skew-x-[2deg]">
              
              {dispatchQueue.map((report) => (
                <div 
                  key={report.id}
                  className={`w-full p-4 border rounded-sm relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer ${
                    report.status === 'CRITICAL' 
                      ? 'border-semantic-urgent bg-semantic-urgent/5' 
                      : report.status === 'DISPATCHED'
                        ? 'border-semantic-warning bg-semantic-warning/5'
                        : 'border-border-subtle bg-app-bg hover:border-brand-primary'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono font-bold tracking-wider text-text-muted">{report.id}</span>
                    
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${
                      report.status === 'CRITICAL' ? 'bg-semantic-urgent text-white' :
                      report.status === 'DISPATCHED' ? 'bg-semantic-warning text-white' :
                      'bg-surface-subtle text-text-secondary border border-border-subtle'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-text-primary text-lg mb-1">{report.type}</h3>
                  
                  <div className="flex items-center gap-1 text-text-secondary text-sm mb-3">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{report.location}</span>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle/50">
                    <div className="flex items-center gap-1 text-xs text-text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      {report.time}
                    </div>
                    
                    {report.status === 'CRITICAL' ? (
                      <button className="text-xs font-bold text-brand-white bg-semantic-urgent hover:bg-red-600 px-3 py-1.5 rounded-sm flex items-center gap-1 transition-colors">
                        <Truck className="w-3 h-3" /> DISPATCH
                      </button>
                    ) : (
                      <button className="text-xs font-bold text-brand-primary hover:text-brand-secondary flex items-center gap-1">
                        DETAILS <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
