import React from 'react';
import NewCalendar from '../../components/NewCalendar';

const GlobalCalendar = () => {
  return (
    <div className="w-full h-full min-h-0 flex flex-col flex-1 overflow-hidden">
      <NewCalendar fillViewport />
    </div>
  );
};

export default GlobalCalendar;
