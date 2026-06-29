import { useNavigate } from 'react-router'
import { Users, UserCheck, Plus, ChevronLeft, TrendingUp } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

const batches = [
  { id: 1, name: 'دفعة 2026 — هندسة', students: 45, confirmed: 38, status: 'confirmed', college: 'كلية الهندسة', department: 'قسم الحاسوب' },
  { id: 2, name: 'دفعة 2026 — طب', students: 32, confirmed: 28, status: 'confirmed', college: 'كلية الطب', department: 'الطب البشري' },
  { id: 3, name: 'دفعة 2026 — علوم', students: 28, confirmed: 15, status: 'draft', college: 'كلية العلوم', department: 'قسم الفيزياء' },
  { id: 4, name: 'دفعة 2026 — إدارة', students: 19, confirmed: 8, status: 'draft', college: 'كلية الإدارة', department: 'إدارة الأعمال' },
]

export default function RepresentativeBatches() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="representative" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/representative')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-warka-text">الدفعات</h1>
            <button
              onClick={() => navigate('/representative/batches/new')}
              className="flex items-center gap-2 px-4 py-2 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors"
            >
              <Plus className="h-4 w-4" />
              دفعة جديدة
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {batches.map((batch, i) => (
            <motion.div
              key={batch.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/representative/batches/${batch.id}`)}
              className="bg-white rounded-2xl p-5 shadow-card hover:shadow-card-hover cursor-pointer transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-warka-text">{batch.name}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  batch.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                }`}>
                  {batch.status === 'confirmed' ? 'مؤكدة' : 'مسودة'}
                </span>
              </div>

              <div className="text-xs text-warka-text-secondary mb-4">
                {batch.college} — {batch.department}
              </div>

              <div className="flex items-center gap-4 text-sm mb-3">
                <span className="flex items-center gap-1 text-warka-text-secondary">
                  <Users className="h-4 w-4" />
                  {batch.students}
                </span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <UserCheck className="h-4 w-4" />
                  {batch.confirmed}
                </span>
                <span className="flex items-center gap-1 text-warka-text-muted mr-auto">
                  <TrendingUp className="h-4 w-4" />
                  {Math.round((batch.confirmed / batch.students) * 100)}%
                </span>
              </div>

              <div className="h-2 bg-warka-bg rounded-full overflow-hidden">
                <div
                  className="h-full bg-warka-primary rounded-full"
                  style={{ width: `${(batch.confirmed / batch.students) * 100}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
