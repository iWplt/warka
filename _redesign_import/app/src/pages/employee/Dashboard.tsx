import { useNavigate } from 'react-router'
import {
  ClipboardList,
  Printer,
  Truck,
  Clock,
  ChevronLeft,
} from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

export default function EmployeeDashboard() {
  const navigate = useNavigate()

  const stats = [
    { label: 'جاهز للطباعة', value: '8', icon: Printer, color: 'bg-cyan-50 text-cyan-600' },
    { label: 'قيد الطباعة', value: '5', icon: Clock, color: 'bg-purple-50 text-purple-600' },
    { label: 'جاهز للاستلام', value: '3', icon: Truck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'إجمالي الطلبات', value: '16', icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
  ]

  const queue = [
    { id: 1025, product: 'وشاح تخرج', type: 'فردي', status: 'ready_for_printing', deadline: '2025-06-30' },
    { id: 1024, product: 'رداء + قبعة', type: 'فردي', status: 'printing', deadline: '2025-06-29' },
    { id: 1021, product: 'وشاح ×45', type: 'جماعي', status: 'ready_for_printing', deadline: '2025-07-01' },
  ]

  const statusLabels: Record<string, string> = {
    ready_for_printing: 'جاهز للطباعة',
    printing: 'قيد الطباعة',
  }

  const statusColors: Record<string, string> = {
    ready_for_printing: 'bg-cyan-50 text-cyan-700',
    printing: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="employee" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-warka-text">لوحة التحكم</h1>
          <p className="text-sm text-warka-text-secondary mt-1">نظرة عامة على طابور الطباعة</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-warka-text">{s.value}</div>
              <div className="text-xs text-warka-text-secondary mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-card overflow-hidden"
        >
          <div className="p-5 border-b border-warka-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-warka-text">طابور الطباعة</h2>
            <button
              onClick={() => navigate('/employee/printing')}
              className="text-sm text-warka-primary hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-warka-border">
            {queue.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-warka-bg/50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-warka-text">#{item.id} — {item.product}</p>
                  <p className="text-xs text-warka-text-muted">{item.type} — الموعد النهائي: {item.deadline}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}>
                  {statusLabels[item.status]}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
