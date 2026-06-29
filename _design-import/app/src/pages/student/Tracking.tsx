import { useNavigate } from 'react-router'
import { ChevronLeft, MapPin, Search } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

export default function StudentTracking() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="student" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/student')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">متابعة الطلب</h1>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Search */}
          <div className="bg-white rounded-2xl p-5 shadow-card mb-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warka-text-muted" />
              <input
                type="text"
                placeholder="أدخل رقم الطلب..."
                className="w-full pr-10 pl-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
              />
            </div>
            <button className="w-full mt-3 py-2.5 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors">
              بحث
            </button>
          </div>

          {/* Current Order Status */}
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-warka-primary/10 flex items-center justify-center">
                <MapPin className="h-6 w-6 text-warka-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-warka-text">طلب #1025</h2>
                <p className="text-xs text-warka-text-secondary">وشاح تخرج — آخر تحديث: منذ ساعة</p>
              </div>
              <span className="mr-auto px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
                قيد التصميم
              </span>
            </div>

            {/* Progress Bar */}
            <div className="relative mb-6">
              <div className="h-2 bg-warka-bg rounded-full overflow-hidden">
                <div className="h-full bg-warka-primary rounded-full" style={{ width: '42%' }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-warka-text-muted">
                <span>استلام</span>
                <span>تصميم</span>
                <span>طباعة</span>
                <span>تسليم</span>
              </div>
            </div>

            {/* Status Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">تم استلام الطلب</p>
                  <p className="text-xs text-emerald-600">28 يونيو 2025 — 10:30 ص</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">قيد المراجعة</p>
                  <p className="text-xs text-emerald-600">28 يونيو 2025 — 02:00 م</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-purple-800">قيد التصميم</p>
                  <p className="text-xs text-purple-600">29 يونيو 2025 — 09:00 ص</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-warka-bg rounded-xl opacity-60">
                <div className="w-2 h-2 rounded-full bg-warka-text-muted" />
                <p className="text-sm text-warka-text-muted">جاهز للطباعة</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-warka-bg rounded-xl opacity-60">
                <div className="w-2 h-2 rounded-full bg-warka-text-muted" />
                <p className="text-sm text-warka-text-muted">تم التسليم</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
