import React from 'react';
import { Clock } from 'lucide-react';

const ActivityRow = ({ activity, getActivityIcon }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="flex items-center">
          <Clock className="w-3 h-3 text-gray-400 mr-1" />
          <span className="text-xs text-gray-900">{activity.date}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center">
          {getActivityIcon(activity.type)}
          <span className="ml-1 text-xs font-medium text-gray-900">{activity.action}</span>
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-gray-900">{activity.target}</td>
      <td className="px-4 py-3 text-xs text-gray-900">{activity.user}</td>
      <td className="px-4 py-3 text-xs text-gray-500">{activity.details}</td>
    </tr>
  );
};

export default ActivityRow;
