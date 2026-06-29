import { useNavigate } from 'react-router'
import {
  Users,
  ClipboardList,
  UserCheck,
  GraduationCap,
  ChevronLeft,
  Plus,
  TrendingUp,
} from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

export default function RepresentativeDashboard() {
  const navigate = useNavigate()

  const stats = [
    { label: 'الدفعات', value: '5', icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'الطلاب', value: '124', icon: GraduationCap, color: 'bg-purple-50 text-purple-600' },
    { label: 'المؤكدين', value: '98', icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'الطلبات النشطة', value: '3', icon: ClipboardList, color: 'bg-amber-50 text-amber-600' },
  ]

  const batches = [
    { id: 1, name: 'دفعة 2026 — هندسة', students: 45, confirmed: 38, status: 'confirmed' },
    { id: 2, name: 'دفعة 2026 — طب', students: 32, confirmed: 28, status: 'confirmed' },
    { id: 3, name: 'دفعة 2026 — علوم', students: 28, confirmed: 15, status: 'draft' },
  ]

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="representative" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-warka-text">لوحة التحكم</h1>
          <p className="text-sm text-warka-text-secondary mt-1">نظرة عامة على دفعاتك وطلابك</p>
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

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => navigate('/representative/batches/new')}
            className="flex items-center gap-2 px-5 py-3 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors"
          >
            <Plus className="h-4 w-4" />
            دفعة جديدة
          </button>
          <button
            onClick={() => navigate('/representative/orders')}
            className="flex items-center gap-2 px-5 py-3 border border-warka-border text-warka-text text-sm font-semibold rounded-xl hover:bg-white transition-colors"
          >
            <ClipboardList className="h-4 w-4" />
            الطلبات
          </button>
        </div>

        {/* Batches */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-card overflow-hidden"
        >
          <div className="p-5 border-b border-warka-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-warka-text">الدفعات</h2>
            <button
              onClick={() => navigate('/representative/batches')}
              className="text-sm text-warka-primary hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-warka-border">
            {batches.map((batch) => (
              <div
                key={batch.id}
                onClick={() => navigate(`/representative/batches/${batch.id}`)}
                className="p-4 hover:bg-warka-bg/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-warka-text">{batch.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    batch.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {batch.status === 'confirmed' ? 'مؤكدة' : 'مسودة'}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-xs text-warka-text-secondary">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {batch.students} طالب
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5" />
                    {batch.confirmed} مؤكد
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {Math.round((batch.confirmed / batch.students) * 100)}%
                  </span>
                </div>
                {/* Progress */}
                <div className="mt-3 h-1.5 bg-warka-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warka-primary rounded-full transition-all"
                    style={{ width: `${(batch.confirmed / batch.students) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
