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
    <div className={`space-y-3 ${className}`}>
      <h4 className="text-default-700 text-sm font-semibold">Sources:</h4>
      <div className="space-y-2">
        {citations.map((citation, index) => (
          <a
            key={index}
            href={citation.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg border border-gray-200 bg-gray-50 p-3 transition-colors hover:bg-white"
          >
            <div className="flex flex-col gap-1">
              <h5 className="text-default-900 text-sm font-medium">{citation.title}</h5>
              <div className="text-default-500 flex gap-2 text-xs">
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
