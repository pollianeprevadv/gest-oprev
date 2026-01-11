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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <div className="p-2 bg-navy-50 rounded-full text-navy-900">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-serif font-semibold text-navy-900">{value}</span>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
            <span className="ml-1">{trend}</span>
          </div>
        )}
      </div>
    </div>
  );
};