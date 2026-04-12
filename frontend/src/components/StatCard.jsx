import { motion } from 'framer-motion';

export default function StatCard({ icon: Icon, title, value, subtitle, color = 'primary', delay = 0 }) {
  const gradients = {
    primary: 'from-primary-500/20 to-purple-500/10 border-primary-500/20',
    green: 'from-emerald-500/20 to-green-500/10 border-emerald-500/20',
    red: 'from-red-500/20 to-orange-500/10 border-red-500/20',
    blue: 'from-blue-500/20 to-cyan-500/10 border-blue-500/20',
    yellow: 'from-yellow-500/20 to-amber-500/10 border-yellow-500/20',
  };

  const iconColors = {
    primary: 'text-primary-400',
    green: 'text-emerald-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    yellow: 'text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={`glass-card bg-gradient-to-br ${gradients[color]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-white/5 ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <h3 className="text-3xl font-bold text-white mb-1">{value}</h3>
      <p className="text-sm font-medium text-gray-400">{title}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </motion.div>
  );
}
