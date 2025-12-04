import React, { useState, useEffect, useMemo } from 'react';
import { 
  Save, 
  Settings, 
  Mic2, 
  FileJson, 
  Activity, 
  LayoutGrid,
  Clipboard,
  Check,
  Search,
  Maximize2,
  Minimize2
} from 'lucide-react';

const INITIAL_DATA = {
  meta: {
    studioName: "Project Studio Manager",
    version: "2.1.0",
    lastUpdated: new Date().toISOString()
  },
  bays: [] // Start empty, user will paste config
};

const Card = ({ children, className = "" }) => (
  <div className={`bg-slate-800 border border-slate-700 rounded-lg p-4 shadow-sm ${className}`}>
    {children}
  </div>
);

const Button = ({ children, onClick, variant = "primary", className = "", icon: Icon }) => {
  const baseStyle = "flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500",
    secondary: "bg-slate-700 hover:bg-slate-600 text-slate-200 focus:ring-slate-500",
    danger: "bg-red-900/50 hover:bg-red-900/70 text-red-200 border border-red-800 focus:ring-red-500",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500"
  };

  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`}>
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export default function StudioManager() {
  const [activeTab, setActiveTab] = useState('config'); // Default to Config so user can paste data
  const [data, setData] = useState(INITIAL_DATA);
  const [jsonInput, setJsonInput] = useState(JSON.stringify(INITIAL_DATA, null, 2));
  const [jsonError, setJsonError] = useState(null);
  const [copyStatus, setCopyStatus] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedBay, setExpandedBay] = useState(null);

  // Sync JSON input when data changes internally
  useEffect(() => {
    setJsonInput(JSON.stringify(data, null, 2));
  }, [data]);

  const handleJsonChange = (e) => {
    const newVal = e.target.value;
    setJsonInput(newVal);
    try {
      const parsed = JSON.parse(newVal);
      setData(parsed);
      setJsonError(null);
    } catch (err) {
      setJsonError(err.message);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonInput);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const downloadConfig = () => {
    const blob = new Blob([jsonInput], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `studio-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isMatch = (text) => {
    if (!searchQuery) return false;
    if (!text) return false;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  // --- COMPONENT: Patch Bay Rack Unit ---
  const PatchBayUnit = ({ bay }) => {
    const isExpanded = expandedBay === bay.id;

    return (
      <div className={`bg-slate-900 border border-slate-700 rounded-md relative overflow-hidden transition-all duration-300 ${isExpanded ? 'mb-8 ring-2 ring-blue-500' : 'mb-4'}`}>
        
        {/* Rack Ears & Header */}
        <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center sticky left-0 z-10">
          <div className="flex items-center gap-4">
             {/* Screw Holes */}
             <div className="flex flex-col gap-1 opacity-50">
               <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-slate-600"></div>
               <div className="w-1.5 h-1.5 rounded-full bg-slate-950 border border-slate-600"></div>
             </div>
             <div>
               <h3 className="text-sm font-bold text-slate-200 tracking-wider uppercase">{bay.name}</h3>
               <p className="text-xs text-slate-500">{bay.description}</p>
             </div>
          </div>
          <button 
            onClick={() => setExpandedBay(isExpanded ? null : bay.id)}
            className="text-slate-400 hover:text-white"
          >
            {isExpanded ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}
          </button>
        </div>

        {/* The Patch Points */}
        <div className="overflow-x-auto">
          {/* Changed min-w-max and removed gap to use borders for separation */}
          <div className="flex min-w-max">
            {bay.channels.map((ch, idx) => {
              // Highlighting logic
              const highlight = isMatch(ch.top) || isMatch(ch.bottom) || isMatch(ch.notes);
              const isSpareTop = ch.top === '*Spare*';
              const isSpareBottom = ch.bottom === '*Spare*';
              
              return (
                <div 
                  key={ch.id} 
                  // Increased width to w-20 (80px), added border, added padding
                  className={`flex flex-col w-20 items-center px-1 py-3 border-r border-slate-800/50 group relative ${highlight ? 'bg-blue-900/20' : ''} hover:bg-slate-800/50 transition-colors`}
                >
                  <div className="text-[9px] text-slate-500 mb-1 font-mono absolute top-1 left-1 opacity-50">{ch.id}</div>
                  
                  {/* Top Label - NOW WRAPS */}
                  <div className="w-full h-8 mb-1 flex items-end justify-center">
                    <div className={`text-[9px] leading-3 text-center break-words w-full ${isMatch(ch.top) ? 'text-blue-300 font-bold' : isSpareTop ? 'text-slate-600 italic font-light' : 'text-slate-300'}`}>
                      {isSpareTop ? 'Spare' : ch.top}
                    </div>
                  </div>

                  {/* Top Jack (Source) */}
                  <div className={`w-10 h-10 rounded-sm border ${highlight ? 'border-blue-400 bg-blue-900/20' : 'border-slate-700 bg-slate-800'} flex items-center justify-center relative flex-shrink-0`}>
                    <div className="w-5 h-5 rounded-full bg-black border border-slate-600 shadow-inner"></div>
                    {/* Hover Tooltip (still useful for extremely long text) */}
                    <div className="hidden group-hover:block absolute bottom-full mb-1 z-20 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded border border-slate-700 shadow-xl pointer-events-none">
                      {ch.top}
                    </div>
                  </div>

                  {/* Normalization Graphic */}
                  <div className="h-8 w-full flex justify-center items-center my-0.5 relative">
                    {/* Vertical Line */}
                    {ch.norm !== 'NN' && (
                        <div className={`h-full w-1 rounded-full ${ch.norm === 'FN' ? 'bg-emerald-500/60' : 'bg-yellow-500/80'}`}></div>
                    )}
                    
                    {/* Norm Label */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] text-slate-600 font-mono opacity-50">
                        {ch.norm}
                    </div>
                  </div>

                  {/* Bottom Jack (Dest) */}
                  <div className={`w-10 h-10 rounded-sm border ${highlight ? 'border-blue-400 bg-blue-900/20' : 'border-slate-700 bg-slate-800'} flex items-center justify-center relative flex-shrink-0`}>
                    <div className="w-5 h-5 rounded-full bg-black border border-slate-600 shadow-inner"></div>
                     <div className="hidden group-hover:block absolute top-full mt-1 z-20 whitespace-nowrap bg-black text-white text-xs px-2 py-1 rounded border border-slate-700 shadow-xl pointer-events-none">
                      {ch.bottom}
                    </div>
                  </div>

                  {/* Bottom Label - NOW WRAPS */}
                  <div className="w-full h-8 mt-1 flex items-start justify-center">
                    <div className={`text-[9px] leading-3 text-center break-words w-full ${isMatch(ch.bottom) ? 'text-blue-300 font-bold' : isSpareBottom ? 'text-slate-600 italic font-light' : 'text-slate-300'}`}>
                      {isSpareBottom ? 'Spare' : ch.bottom}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const PatchBayView = () => {
    if (!data.bays || data.bays.length === 0) {
      return (
        <div className="text-center py-20 opacity-50 flex flex-col items-center">
          <FileJson size={48} className="mb-4 text-slate-600" />
          <h3 className="text-lg font-medium text-slate-300">No Configuration Loaded</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-md">
            Switch to the <strong>Configuration</strong> tab and paste the contents of your <code className="text-emerald-500">studio.json</code> file to visualize your rack.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-2 pb-20">
        <div className="flex justify-between items-center mb-6 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
           <div>
             <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <LayoutGrid className="text-blue-400" /> Master Rack
            </h2>
            <div className="text-xs text-slate-400 mt-2 flex gap-6">
              <span className="flex items-center gap-2"><div className="w-3 h-1 bg-emerald-500 rounded-full"></div> Full Normal (FN)</span>
              <span className="flex items-center gap-2"><div className="w-3 h-1 bg-yellow-500 rounded-full"></div> Half Normal (HN)</span>
              <span className="text-slate-600 border-l border-slate-700 pl-4">No Line = Non-Normal (NN)</span>
            </div>
           </div>
           
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
              type="text" 
              placeholder="Find gear..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none w-64 shadow-inner"
             />
           </div>
        </div>

        {data.bays.map(bay => (
          <PatchBayUnit key={bay.id} bay={bay} />
        ))}
      </div>
    );
  };

  const ConfigView = () => (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="text-emerald-400" /> Source of Truth
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Copy the JSON below into a file named <code className="text-emerald-400">studio.json</code>.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={copyToClipboard} variant="secondary" icon={copyStatus ? Check : Clipboard}>
            {copyStatus ? "Copied!" : "Copy JSON"}
          </Button>
          <Button onClick={downloadConfig} variant="success" icon={Save}>
            Download
          </Button>
        </div>
      </div>

      <div className="relative flex-grow">
        <textarea
          value={jsonInput}
          onChange={handleJsonChange}
          className={`w-full h-[600px] font-mono text-xs leading-relaxed bg-slate-950 text-emerald-500 p-4 rounded-lg border focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-y ${jsonError ? 'border-red-500' : 'border-slate-700'}`}
          spellCheck="false"
        />
        {jsonError && (
          <div className="absolute bottom-4 left-4 right-4 bg-red-900/90 text-white p-3 rounded border border-red-500 text-sm">
            JSON Error: {jsonError}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Activity size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-none">{data.meta.studioName || "Studio Manager"}</h1>
              <span className="text-xs text-slate-500">v{data.meta.version}</span>
            </div>
          </div>
          
          <nav className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
            {[
              { id: 'patchbay', label: 'Patchbays', icon: LayoutGrid },
              { id: 'config', label: 'Configuration', icon: FileJson },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'patchbay' && <PatchBayView />}
        {activeTab === 'config' && <ConfigView />}
      </main>
    </div>
  );
}
