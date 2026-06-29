import { useNavigate } from 'react-router'
import { ChevronLeft, BarChart3, FileSpreadsheet, FileText } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'

const statusData = [
  { name: 'جديد', count: 5 },
  { name: 'قيد التصميم', count: 8 },
  { name: 'قيد الطباعة', count: 5 },
  { name: 'جاهز للتسليم', count: 3 },
  { name: 'تم التسليم', count: 45 },
  { name: 'ملغي', count: 2 },
]

const activityLog = [
  { action: 'تغيير حالة طلب #1025', user: 'المدير', time: 'منذ 5 دقائق' },
  { action: 'إضافة دفعة جديدة', user: 'ممثل الدفعة', time: 'منذ ساعة' },
  { action: 'رفع معاينة تصميم', user: 'المدير', time: 'منذ ساعتين' },
  { action: 'تسجيل دفعة', user: 'المدير', time: 'منذ 3 ساعات' },
]

export default function AdminReports() {
  const navigate = useNavigate()

  const handleExport = (type: string) => {
    toast.success(`تم تصدير ${type}`)
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">التقارير</h1>
        </motion.div>

        {/* Export Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button onClick={() => handleExport('Excel')} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm rounded-xl hover:bg-emerald-700 transition-colors">
            <FileSpreadsheet className="h-4 w-4" /> تصدير Excel
          </button>
          <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm rounded-xl hover:bg-red-600 transition-colors">
            <FileText className="h-4 w-4" /> تصدير PDF
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by Status */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-warka-text mb-4">الطلبات حسب الحالة</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                <Bar dataKey="count" fill="#5C5C47" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Activity Log */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-warka-text mb-4">سجل النشاط</h2>
            <div className="space-y-3">
              {activityLog.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-warka-bg rounded-xl">
                  <div className="w-8 h-8 rounded-full bg-warka-primary/10 flex items-center justify-center shrink-0"><BarChart3 className="h-4 w-4 text-warka-primary" /></div>
                  <div><p className="text-sm font-medium text-warka-text">{a.action}</p><p className="text-xs text-warka-text-secondary">{a.user} — {a.time}</p></div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
