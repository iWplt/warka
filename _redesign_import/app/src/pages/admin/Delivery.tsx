import { useNavigate } from 'react-router'
import { ChevronLeft, Truck, CheckCircle, MapPin } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

const initialDeliveries = [
  { id: 1022, product: 'قبعة تخرج', customer: 'محمد خالد', status: 'ready', address: 'بغداد، الكرادة' },
  { id: 1018, product: 'وشاح ×2', customer: 'علي حسن', status: 'ready', address: 'بغداد، المنصور' },
  { id: 1017, product: 'رداء تخرج', customer: 'فاطمة أحمد', status: 'delivering', address: 'بغداد، اليرموك' },
]

export default function AdminDelivery() {
  const navigate = useNavigate()
  const [items, setItems] = useState(initialDeliveries)

  const markDelivered = (id: number) => {
    setItems(items.filter((i) => i.id !== id))
    toast.success('تم تأكيد التسليم')
  }

  const ready = items.filter((i) => i.status === 'ready')
  const delivering = items.filter((i) => i.status === 'delivering')

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">طابور التسليم</h1>
        </motion.div>

        <div className="space-y-4">
          {ready.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Truck className="h-5 w-5 text-emerald-600" /></div>
                <div><p className="text-sm font-bold">#{item.id} — {item.product}</p><p className="text-xs text-warka-text-secondary flex items-center gap-1"><MapPin className="h-3 w-3" />{item.address}</p></div>
              </div>
              <button onClick={() => markDelivered(item.id)} className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-1"><CheckCircle className="h-4 w-4" /> تسليم</button>
            </motion.div>
          ))}
          {delivering.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card flex items-center justify-between opacity-70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Truck className="h-5 w-5 text-amber-600" /></div>
                <div><p className="text-sm font-bold">#{item.id} — {item.product}</p><p className="text-xs text-warka-text-secondary">قيد التوصيل</p></div>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-full">قيد التوصيل</span>
            </motion.div>
          ))}
          {items.length === 0 && <p className="text-center text-warka-text-muted py-12">لا توجد طلبات للتسليم</p>}
        </div>
      </main>
    </div>
  )
}
