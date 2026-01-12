import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  trend?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, isPositive, icon }) => {
  return (
    <div className="bg-white p-3 md:p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between mb-2 md:mb-4">
        <h3 className="text-gray-500 text-[10px] md:text-sm font-medium uppercase tracking-wider leading-tight">{title}</h3>
        <div className="p-1.5 md:p-2 bg-navy-50 rounded-full text-navy-900 flex-shrink-0 ml-2">
          <span className="[&>svg]:w-4 [&>svg]:h-4 md:[&>svg]:w-5 md:[&>svg]:h-5">
            {icon}
          </span>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-lg md:text-2xl font-serif font-semibold text-navy-900 truncate">{value}</span>
        {trend && (
          <div className={`flex items-center text-xs md:text-sm font-medium flex-shrink-0 ml-2 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight size={14} className="md:w-4 md:h-4" /> : <ArrowDownRight size={14} className="md:w-4 md:h-4" />}
            <span className="ml-0.5 md:ml-1 hidden sm:inline">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};