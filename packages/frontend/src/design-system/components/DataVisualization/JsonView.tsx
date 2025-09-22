// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useState, useMemo } from 'react'
// import { Button, Space, Typography, Tooltip, Input, Switch } from 'antd'
// import {
//   CopyOutlined,
//   CompressOutlined,
//   ExpandOutlined,
//   FormatPainterOutlined,
//   SearchOutlined
// } from '@ant-design/icons'

// const { Text } = Typography

// interface JsonViewProps {
//   data: any
//   onFieldClick?: (fieldPath: string) => void
//   compact?: boolean
//   highlightPath?: string
// }

// interface JsonLineProps {
//   line: string
//   lineNumber: number
//   isHighlighted: boolean
//   onFieldClick?: (fieldPath: string) => void
// }

// const JsonLine: React.FC<JsonLineProps> = ({
//   line,
//   lineNumber,
//   isHighlighted,
//   onFieldClick
// }) => {
//   const handleClick = () => {
//     // Extract field path from JSON line (simplified)
//     const fieldMatch = line.match(/"([^"]+)":\s*/)
//     if (fieldMatch && onFieldClick) {
//       onFieldClick(fieldMatch[1])
//     }
//   }

//   return (
//     <div
//       className={`flex items-start hover:bg-gray-700 ${isHighlighted ? 'bg-yellow-900' : ''}`}
//       onClick={handleClick}
//     >
//       <span className="text-gray-500 text-xs mr-4 select-none w-8 text-right">
//         {lineNumber}
//       </span>
//       <pre className="text-sm text-gray-300 font-mono flex-1 whitespace-pre-wrap cursor-pointer">
//         <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }} />
//       </pre>
//     </div>
//   )
// }

// const syntaxHighlight = (json: string): string => {
//   return json
//     .replace(/&/g, "&amp;")
//     .replace(/</g, "&lt;")
//     .replace(/>/g, "&gt;")
//     .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
//       function (match) {
//         let cls = 'text-yellow-400' // numbers
//         if (/^"/.test(match)) {
//           if (/:$/.test(match)) {
//             cls = 'text-blue-400' // keys
//           } else {
//             cls = 'text-green-400' // strings
//           }
//         } else if (/true|false/.test(match)) {
//           cls = 'text-purple-400' // booleans
//         } else if (/null/.test(match)) {
//           cls = 'text-red-400' // null
//         }
//         return `<span class="${cls}">${match}</span>`
//       }
//     )
// }

// const JsonView: React.FC<JsonViewProps> = ({
//   data,
//   onFieldClick,
//   compact = false,
//   highlightPath
// }) => {
//   const [collapsed, setCollapsed] = useState(compact)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [showLineNumbers, setShowLineNumbers] = useState(true)

//   const formattedJson = useMemo(() => {
//     if (!data) return ''
//     return JSON.stringify(data, null, collapsed ? 0 : 2)
//   }, [data, collapsed])

//   const jsonLines = useMemo(() => {
//     return formattedJson.split('\n')
//   }, [formattedJson])

//   const filteredLines = useMemo(() => {
//     if (!searchTerm) return jsonLines

//     return jsonLines
//       .map((line, index) => ({ line, index }))
//       .filter(({ line }) =>
//         line.toLowerCase().includes(searchTerm.toLowerCase())
//       )
//   }, [jsonLines, searchTerm])

//   const handleCopy = () => {
//     navigator.clipboard.writeText(formattedJson)
//   }

//   const handleFormat = () => {
//     setCollapsed(!collapsed)
//   }

//   if (!data) {
//     return (
//       <div className="p-8 text-center text-gray-400">
//         <FormatPainterOutlined className="text-4xl mb-2" />
//         <div>No JSON data to display</div>
//       </div>
//     )
//   }

//   return (
//     <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden h-full flex flex-col">
//       {/* Header Controls */}
//       <div className={`${compact ? 'p-2' : 'p-3'} border-b border-gray-700 bg-gray-800 flex-shrink-0`}>
//         <div className="flex items-center justify-between">
//           <Space size={compact ? 'small' : 'middle'}>
//             <Input
//               placeholder="Search JSON..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               style={{ width: compact ? 150 : 200 }}
//               size="small"
//               prefix={<SearchOutlined />}
//             />
//             {!compact && (
//               <>
//                 <Switch
//                   checked={showLineNumbers}
//                   onChange={setShowLineNumbers}
//                   size="small"
//                 />
//                 <Text className="text-gray-400 text-xs">Line numbers</Text>
//               </>
//             )}
//           </Space>

//           <Space size="small">
//             <Tooltip title={collapsed ? "Expand JSON" : "Collapse JSON"}>
//               <Button
//                 icon={collapsed ? <ExpandOutlined /> : <CompressOutlined />}
//                 size="small"
//                 onClick={handleFormat}
//                 className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
//               />
//             </Tooltip>
//             <Tooltip title="Copy JSON">
//               <Button
//                 icon={<CopyOutlined />}
//                 size="small"
//                 onClick={handleCopy}
//                 className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
//               />
//             </Tooltip>
//           </Space>
//         </div>

//         {searchTerm && (
//           <div className="mt-2">
//             <Text className="text-gray-400 text-xs">
//               {filteredLines.length} matches found
//             </Text>
//           </div>
//         )}
//       </div>

//       {/* JSON Content */}
//       <div className="p-2 overflow-auto flex-1">
//         {searchTerm ? (
//           // Filtered view
//           <div className="space-y-1">
//             {filteredLines.map(({ line, index }) => (
//               <JsonLine
//                 key={index}
//                 line={line}
//                 lineNumber={showLineNumbers ? index + 1 : 0}
//                 isHighlighted={highlightPath ? line.includes(highlightPath) : false}
//                 onFieldClick={onFieldClick}
//               />
//             ))}
//           </div>
//         ) : (
//           // Full JSON view
//           <div className="space-y-1">
//             {jsonLines.map((line, index) => (
//               <JsonLine
//                 key={index}
//                 line={line}
//                 lineNumber={showLineNumbers ? index + 1 : 0}
//                 isHighlighted={highlightPath ? line.includes(highlightPath) : false}
//                 onFieldClick={onFieldClick}
//               />
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Footer Stats - hide in compact mode */}
//       {!compact && (
//         <div className="p-2 border-t border-gray-700 bg-gray-800 flex-shrink-0">
//           <div className="flex justify-between text-xs text-gray-400">
//             <span>{jsonLines.length} lines</span>
//             <span>{(formattedJson.length / 1024).toFixed(1)} KB</span>
//             <span>{Object.keys(data || {}).length} top-level fields</span>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// export default JsonView

import {
  CompressOutlined,
  CopyOutlined,
  ExpandOutlined,
  FormatPainterOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { Button, Input, Space, Switch, Tooltip, Typography } from 'antd';
/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from 'react';
import { useMemo, useState } from 'react';

const { Text } = Typography;

interface JsonViewProps {
  data: any;
  onFieldClick?: (fieldPath: string) => void;
  compact?: boolean;
  highlightPath?: string;
}

interface JsonLineProps {
  line: string;
  lineNumber: number;
  isHighlighted: boolean;
  onFieldClick?: (fieldPath: string) => void;
}

interface LineWithIndex {
  line: string;
  index: number;
}

const JsonLine: React.FC<JsonLineProps> = ({ line, lineNumber, isHighlighted, onFieldClick }) => {
  const handleClick = () => {
    // Extract field path from JSON line (simplified)
    const fieldMatch = line.match(/"([^"]+)":\s*/);
    if (fieldMatch && onFieldClick) {
      onFieldClick(fieldMatch[1]);
    }
  };

  return (
    <div
      className={`flex items-start hover:bg-gray-700 ${isHighlighted ? 'bg-yellow-900' : ''}`}
      onClick={handleClick}
    >
      <span className="text-gray-500 text-xs mr-4 select-none w-8 text-right">{lineNumber}</span>
      <pre className="text-sm text-gray-300 font-mono flex-1 whitespace-pre-wrap cursor-pointer">
        <code dangerouslySetInnerHTML={{ __html: syntaxHighlight(line) }} />
      </pre>
    </div>
  );
};

const syntaxHighlight = (json: string): string => {
  return json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
      (match) => {
        let cls = 'text-yellow-400'; // numbers
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'text-blue-400'; // keys
          } else {
            cls = 'text-green-400'; // strings
          }
        } else if (/true|false/.test(match)) {
          cls = 'text-purple-400'; // booleans
        } else if (/null/.test(match)) {
          cls = 'text-red-400'; // null
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
};

const JsonView: React.FC<JsonViewProps> = ({
  data,
  onFieldClick,
  compact = false,
  highlightPath,
}) => {
  const [collapsed, setCollapsed] = useState(compact);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const formattedJson = useMemo(() => {
    if (!data) return '';
    return JSON.stringify(data, null, collapsed ? 0 : 2);
  }, [data, collapsed]);

  const jsonLines = useMemo(() => {
    return formattedJson.split('\n');
  }, [formattedJson]);

  // Fix: Always return the same type structure
  const filteredLines = useMemo((): LineWithIndex[] => {
    const linesWithIndex = jsonLines.map((line, index) => ({ line, index }));

    if (!searchTerm) {
      return linesWithIndex;
    }

    return linesWithIndex.filter(({ line }) =>
      line.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [jsonLines, searchTerm]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson);
  };

  const handleFormat = () => {
    setCollapsed(!collapsed);
  };

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-400">
        <FormatPainterOutlined className="text-4xl mb-2" />
        <div>No JSON data to display</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden h-full flex flex-col">
      {/* Header Controls */}
      <div
        className={`${compact ? 'p-2' : 'p-3'} border-b border-gray-700 bg-gray-800 flex-shrink-0`}
      >
        <div className="flex items-center justify-between">
          <Space size={compact ? 'small' : 'middle'}>
            <Input
              placeholder="Search JSON..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: compact ? 150 : 200 }}
              size="small"
              prefix={<SearchOutlined />}
            />
            {!compact && (
              <>
                <Switch checked={showLineNumbers} onChange={setShowLineNumbers} size="small" />
                <Text className="text-gray-400 text-xs">Line numbers</Text>
              </>
            )}
          </Space>

          <Space size="small">
            <Tooltip title={collapsed ? 'Expand JSON' : 'Collapse JSON'}>
              <Button
                icon={collapsed ? <ExpandOutlined /> : <CompressOutlined />}
                size="small"
                onClick={handleFormat}
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              />
            </Tooltip>
            <Tooltip title="Copy JSON">
              <Button
                icon={<CopyOutlined />}
                size="small"
                onClick={handleCopy}
                className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
              />
            </Tooltip>
          </Space>
        </div>

        {searchTerm && (
          <div className="mt-2">
            <Text className="text-gray-400 text-xs">{filteredLines.length} matches found</Text>
          </div>
        )}
      </div>

      {/* JSON Content */}
      <div className="p-2 overflow-auto flex-1">
        <div className="space-y-1">
          {filteredLines.map(({ line, index }) => (
            <JsonLine
              key={index}
              line={line}
              lineNumber={showLineNumbers ? index + 1 : 0}
              isHighlighted={highlightPath ? line.includes(highlightPath) : false}
              onFieldClick={onFieldClick}
            />
          ))}
        </div>
      </div>

      {/* Footer Stats - hide in compact mode */}
      {!compact && (
        <div className="p-2 border-t border-gray-700 bg-gray-800 flex-shrink-0">
          <div className="flex justify-between text-xs text-gray-400">
            <span>{jsonLines.length} lines</span>
            <span>{(formattedJson.length / 1024).toFixed(1)} KB</span>
            <span>{Object.keys(data || {}).length} top-level fields</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonView;
