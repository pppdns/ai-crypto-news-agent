import React from 'react';

export interface Citation {
  url: string;
  title: string;
  sourceName: string;
  relativeDate: string;
}

export interface CitationsProps {
  citations: Citation[];
  className?: string;
}

export const Citations: React.FC<CitationsProps> = ({ citations, className = '' }) => {
  if (!citations || citations.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className="text-default-700 text-sm font-medium">Sources:</h4>
      <div className="space-y-1.5">
        {citations.map((citation, index) => (
          <a
            key={index}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded border border-gray-100 bg-white p-2 transition-colors hover:bg-gray-100/50"
          >
            <div className="flex flex-col gap-0.5">
              <h5 className="text-default-700 text-xs font-normal">{citation.title}</h5>
              <div className="text-default-400 flex gap-1.5 text-xs">
                <span>{citation.sourceName}</span>
                <span>•</span>
                <span>{citation.relativeDate}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};
