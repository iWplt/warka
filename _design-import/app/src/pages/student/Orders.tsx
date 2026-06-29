import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ShoppingBag, Search, ChevronLeft } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

const orders = [
  { id: 1025, product: 'وشاح تخرج', status: 'قيد التصميم', date: '2025-06-28', amount: 5000, items: 1 },
  { id: 1024, product: 'رداء + قبعة', status: 'بانتظار المراجعة', date: '2025-06-25', amount: 11000, items: 2 },
  { id: 1023, product: 'وشاح مخصص', status: 'تم التسليم', date: '2025-06-20', amount: 7000, items: 1 },
  { id: 1022, product: 'قبعة تخرج', status: 'تم التسليم', date: '2025-06-15', amount: 3000, items: 1 },
  { id: 1021, product: 'وشاح + رداء', status: 'جاهز للطباعة', date: '2025-06-10', amount: 13000, items: 2 },
  { id: 1020, product: 'طلب مخصص', status: 'ملغي', date: '2025-06-05', amount: 2000, items: 1 },
]

const statusColors: Record<string, string> = {
  'قيد التصميم': 'bg-purple-50 text-purple-700',
  'بانتظار المراجعة': 'bg-amber-50 text-amber-700',
  'تم التسليم': 'bg-emerald-50 text-emerald-700',
  'جاهز للطباعة': 'bg-cyan-50 text-cyan-700',
  'ملغي': 'bg-red-50 text-red-700',
}

const tabs = ['الكل', 'نشط', 'مكتمل', 'ملغي']

export default function StudentOrders() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('الكل')
  const [search, setSearch] = useState('')

  const filtered = orders.filter((o) => {
    if (activeTab === 'نشط') return ['قيد التصميم', 'بانتظار المراجعة', 'جاهز للطباعة'].includes(o.status)
    if (activeTab === 'مكتمل') return o.status === 'تم التسليم'
    if (activeTab === 'ملغي') return o.status === 'ملغي'
    return true
  }).filter((o) => search === '' || o.product.includes(search) || o.id.toString().includes(search))

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="student" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/student')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> العودة
          </button>
          <h1 className="text-2xl font-bold text-warka-text">طلباتي</h1>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warka-text-muted" />
            <input
              type="text"
              placeholder="بحث برقم الطلب أو المنتج..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
            />
          </div>
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-warka-primary text-white'
                    : 'bg-white text-warka-text-secondary border border-warka-border hover:bg-warka-bg'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="divide-y divide-warka-border">
            {filtered.map((order, i) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => navigate(`/student/orders/${order.id}`)}
                className="p-4 flex items-center justify-between hover:bg-warka-bg/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-warka-bg flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-warka-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warka-text">{order.product}</p>
                    <p className="text-xs text-warka-text-muted">#{order.id} — {order.date} — {order.items} عنصر</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-warka-text-muted mt-1">{order.amount.toLocaleString()} د.ع</p>
                </div>
              </motion.div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-warka-text-muted mx-auto mb-3" />
              <p className="text-warka-text-secondary">لا توجد طلبات</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
