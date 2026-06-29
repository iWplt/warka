import { useNavigate } from 'react-router'
import { ChevronLeft, MapPin } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

const batchStatus = [
  { batch: 'دفعة هندسة 2026', orders: 45, status: 'قيد التصميم', progress: 60 },
  { batch: 'دفعة طب 2026', orders: 32, status: 'بانتظار المراجعة', progress: 30 },
  { batch: 'دفعة علوم 2026', orders: 28, status: 'تم التسليم', progress: 100 },
]

export default function RepresentativeTracking() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="representative" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/representative')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">متابعة الدفعات</h1>
        </motion.div>

        <div className="space-y-4">
          {batchStatus.map((batch, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warka-primary/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-warka-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-warka-text">{batch.batch}</h3>
                    <p className="text-xs text-warka-text-secondary">{batch.orders} طلب</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  batch.progress === 100 ? 'bg-emerald-50 text-emerald-700' :
                  batch.progress > 50 ? 'bg-purple-50 text-purple-700' :
                  'bg-amber-50 text-amber-700'
                }`}>
                  {batch.status}
                </span>
              </div>
              <div className="h-2.5 bg-warka-bg rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    batch.progress === 100 ? 'bg-emerald-500' :
                    batch.progress > 50 ? 'bg-warka-primary' : 'bg-amber-500'
                  }`}
                  style={{ width: `${batch.progress}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-warka-text-muted">
                <span>استلام</span>
                <span>تصميم</span>
                <span>طباعة</span>
                <span>تسليم</span>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
