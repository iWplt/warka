import { useNavigate } from 'react-router'
import { ChevronLeft, ShoppingBag } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

const orders = [
  { id: 201, batch: 'دفعة هندسة 2026', product: 'وشاح + رداء', status: 'قيد التصميم', date: '2025-06-28', amount: 585000, count: 45 },
  { id: 202, batch: 'دفعة طب 2026', product: 'وشاح فقط', status: 'بانتظار المراجعة', date: '2025-06-25', amount: 160000, count: 32 },
  { id: 203, batch: 'دفعة علوم 2026', product: 'قبعة', status: 'تم التسليم', date: '2025-06-15', amount: 84000, count: 28 },
]

const statusColors: Record<string, string> = {
  'قيد التصميم': 'bg-purple-50 text-purple-700',
  'بانتظار المراجعة': 'bg-amber-50 text-amber-700',
  'تم التسليم': 'bg-emerald-50 text-emerald-700',
}

export default function RepresentativeOrders() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="representative" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/representative')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">الطلبات</h1>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="divide-y divide-warka-border">
            {orders.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-5 hover:bg-warka-bg/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warka-bg flex items-center justify-center">
                      <ShoppingBag className="h-5 w-5 text-warka-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-warka-text">طلب جماعي #{order.id}</p>
                      <p className="text-xs text-warka-text-muted">{order.batch}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                </div>
                <div className="flex items-center gap-6 text-xs text-warka-text-secondary mr-13">
                  <span>{order.product}</span>
                  <span>{order.count} طالب</span>
                  <span>{order.amount.toLocaleString()} د.ع</span>
                  <span>{order.date}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
