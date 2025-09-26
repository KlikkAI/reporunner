import React from 'react';

const Step = ({ number, text }: { number: number; text: string }) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-800 border border-gray-600">
    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
      {number}
    </div>
    <span className="text-gray-300">{text}</span>
  </div>
);

export const GmailSetupSteps = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">
        Connect your Gmail account
      </h3>
      <div className="space-y-3">
        <Step number={1} text="Enter a name for this credential" />
        <Step number={2} text="Click &quot;Connect with Google&quot; to authorize access" />
        <Step number={3} text="Grant permissions to read and send emails" />
      </div>
    </div>
  );
};