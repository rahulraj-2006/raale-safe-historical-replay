import React from 'react';

interface JsonViewerProps {
  data: any;
  title?: string;
  maxHeight?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ data, title, maxHeight = 'max-h-80' }) => {
  const jsonString = typeof data === 'string' ? data : JSON.stringify(data, null, 2);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl overflow-hidden">
      {title && (
        <div className="bg-slate-900/80 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 font-mono">{title}</span>
          <span className="text-[10px] text-slate-500 font-mono">JSON</span>
        </div>
      )}
      <pre className={`p-4 text-xs font-mono text-cyan-300 overflow-auto ${maxHeight} leading-relaxed`}>
        {jsonString}
      </pre>
    </div>
  );
};
