import React from 'react';
import { motion } from 'framer-motion';

const ArchiveStatsCard = ({ icon, label, value, color, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white p-3 rounded-lg border border-gray-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600">{label}</p>
          <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
        {icon}
      </div>
    </motion.div>
  );
};

export default ArchiveStatsCard;
