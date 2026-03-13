export default function AdminStatsCard({ title, value, icon, trend, color = 'purple' }) {
  const colorClasses = {
    purple: 'from-purple-500 to-purple-700',
    green: 'from-green-500 to-green-700',
    blue: 'from-blue-500 to-blue-700',
    orange: 'from-orange-500 to-orange-700',
    red: 'from-red-500 to-red-700',
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div className="flex-grow">
          <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-sm text-green-600 font-medium mt-1">{trend}</p>
          )}
        </div>
        <div
          className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-3xl`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}
