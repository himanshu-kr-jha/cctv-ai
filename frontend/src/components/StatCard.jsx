import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, title, value, subtitle, color = 'primary', delay = 0 }) {
  const gradients = {
    primary: 'from-accent/10 to-purple-100/50 border-accent/20',
    green: 'from-emerald-100/80 to-green-50 border-emerald-200',
    red: 'from-red-100/80 to-orange-50 border-red-200',
    blue: 'from-blue-100/80 to-cyan-50 border-blue-200',
    yellow: 'from-yellow-100/80 to-amber-50 border-yellow-200',
  };

  const iconColors = {
    primary: 'text-accent',
    green: 'text-emerald-500',
    red: 'text-red-500',
    blue: 'text-blue-500',
    yellow: 'text-yellow-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={`glass-card bg-gradient-to-br ${gradients[color]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-white shadow-sm border border-gray-100 ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-gray-800 mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-600">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </motion.div>
  );
}
