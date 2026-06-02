import React from 'react';
import { useSiteMode } from '../contexts/SiteModeContext';
import { FiTerminal } from 'react-icons/fi';
import '../modes/ExpertMode.css'; // Ensure the styles are loaded

const ExpertDoc = ({ title, data, notes }) => {
  const { isExpert } = useSiteMode();
  
  if (!isExpert) return null;

  return (
    <div className="expert-doc-container">
      <div className="expert-doc-header">
        <div className="expert-doc-title">
          <FiTerminal size={12} />
          <span>{title}</span>
        </div>
        <span>_ARCH</span>
      </div>
      <div className="expert-doc-body">
        {notes && <span className="expert-doc-comment">/* {notes} */</span>}
        {Object.entries(data).map(([key, value], idx) => {
          let valClass = 'string';
          let displayVal = value;
          
          if (typeof value === 'boolean') {
            valClass = 'boolean';
            displayVal = value ? 'true' : 'false';
          } else if (typeof value === 'number') {
            valClass = 'number';
          } else if (typeof value === 'string' && value.startsWith('use')) {
            valClass = 'string';
            displayVal = `"${value}()"`;
          } else {
            displayVal = `"${value}"`;
          }

          return (
            <div key={idx} className="expert-doc-line">
              <span className="expert-doc-key">{key}</span>
              <span>: </span>
              <span className={`expert-doc-value ${valClass}`}>{displayVal}</span>
              <span>,</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ExpertDoc;
