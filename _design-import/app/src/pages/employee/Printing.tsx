import { useNavigate } from 'react-router'
import { ChevronLeft, Printer, Play, CheckCircle, Clock } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

const initialJobs = [
  { id: 1025, product: 'وشاح تخرج', customer: 'أحمد محمد', status: 'ready', priority: 'عالي', deadline: '2025-06-30' },
  { id: 1021, product: 'وشاح ×45', customer: 'ممثل هندسة', status: 'ready', priority: 'عالي', deadline: '2025-07-01' },
  { id: 1026, product: 'رداء تخرج', customer: 'سارة علي', status: 'ready', priority: 'متوسط', deadline: '2025-07-02' },
  { id: 1024, product: 'رداء + قبعة', customer: 'نورة فيصل', status: 'printing', priority: 'عالي', deadline: '2025-06-29', progress: 60 },
  { id: 1020, product: 'قبعة تخرج', customer: 'محمد خالد', status: 'printing', priority: 'منخفض', deadline: '2025-07-03', progress: 30 },
]

export default function EmployeePrinting() {
  const navigate = useNavigate()
  const [jobs, setJobs] = useState(initialJobs)

  const startPrinting = (id: number) => {
    setJobs(jobs.map((j) => j.id === id ? { ...j, status: 'printing', progress: 0 } : j))
    toast.success('تم بدء الطباعة')
  }

  const completePrinting = (id: number) => {
    setJobs(jobs.map((j) => j.id === id ? { ...j, status: 'done', progress: 100 } : j))
    toast.success('تمت الطباعة بنجاح')
  }

  const readyJobs = jobs.filter((j) => j.status === 'ready')
  const printingJobs = jobs.filter((j) => j.status === 'printing')

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="employee" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/employee')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">الطباعة</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ready for Printing */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-warka-text mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-600" />
              جاهز للطباعة ({readyJobs.length})
            </h2>
            <div className="space-y-3">
              {readyJobs.map((job) => (
                <div key={job.id} className="p-4 bg-warka-bg rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-warka-text">#{job.id} — {job.product}</p>
                    <p className="text-xs text-warka-text-secondary">{job.customer} — الموعد: {job.deadline}</p>
                  </div>
                  <button
                    onClick={() => startPrinting(job.id)}
                    className="px-3 py-2 bg-warka-primary text-white text-xs font-medium rounded-lg hover:bg-warka-primary-dark transition-colors flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" />
                    بدء
                  </button>
                </div>
              ))}
              {readyJobs.length === 0 && (
                <p className="text-sm text-warka-text-muted text-center py-6">لا توجد طلبات جاهزة</p>
              )}
            </div>
          </motion.div>

          {/* Currently Printing */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-warka-text mb-4 flex items-center gap-2">
              <Printer className="h-5 w-5 text-purple-600" />
              قيد الطباعة ({printingJobs.length})
            </h2>
            <div className="space-y-4">
              {printingJobs.map((job) => (
                <div key={job.id} className="p-4 bg-warka-bg rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-warka-text">#{job.id} — {job.product}</p>
                      <p className="text-xs text-warka-text-secondary">{job.customer}</p>
                    </div>
                    <button
                      onClick={() => completePrinting(job.id)}
                      className="px-3 py-2 bg-emerald-500 text-white text-xs font-medium rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="h-3 w-3" />
                      إنهاء
                    </button>
                  </div>
                  <div className="h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-warka-text-muted mt-1">{job.progress}% مكتمل</p>
                </div>
              ))}
              {printingJobs.length === 0 && (
                <p className="text-sm text-warka-text-muted text-center py-6">لا توجد طلبات قيد الطباعة</p>
              )}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
