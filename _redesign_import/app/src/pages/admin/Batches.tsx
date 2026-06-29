import { useNavigate } from 'react-router'
import { ChevronLeft, Package, Users, UserCheck, TrendingUp } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

const batches = [
  { id: 1, name: 'دفعة 2026 — هندسة', college: 'كلية الهندسة', dept: 'قسم الحاسوب', students: 45, confirmed: 38, rep: 'أحمد محمد' },
  { id: 2, name: 'دفعة 2026 — طب', college: 'كلية الطب', dept: 'الطب البشري', students: 32, confirmed: 28, rep: 'سارة علي' },
  { id: 3, name: 'دفعة 2026 — علوم', college: 'كلية العلوم', dept: 'قسم الفيزياء', students: 28, confirmed: 15, rep: 'محمد خالد' },
]

export default function AdminBatches() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">الدفعات</h1>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {batches.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-warka-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-warka-primary" /></div>
                <span className="text-xs text-warka-text-muted">{b.rep}</span>
              </div>
              <h3 className="text-sm font-bold text-warka-text mb-1">{b.name}</h3>
              <p className="text-xs text-warka-text-secondary mb-4">{b.college} — {b.dept}</p>
              <div className="flex items-center gap-4 text-xs mb-3">
                <span className="flex items-center gap-1 text-warka-text-secondary"><Users className="h-3.5 w-3.5" />{b.students}</span>
                <span className="flex items-center gap-1 text-emerald-600"><UserCheck className="h-3.5 w-3.5" />{b.confirmed}</span>
                <span className="flex items-center gap-1 text-warka-text-muted mr-auto"><TrendingUp className="h-3.5 w-3.5" />{Math.round((b.confirmed / b.students) * 100)}%</span>
              </div>
              <div className="h-2 bg-warka-bg rounded-full overflow-hidden"><div className="h-full bg-warka-primary rounded-full" style={{ width: `${(b.confirmed / b.students) * 100}%` }} /></div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
