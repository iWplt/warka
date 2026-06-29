import { useNavigate } from 'react-router'
import { ChevronLeft, Search, Eye } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'

const orders = [
  { id: 1025, product: 'وشاح تخرج', customer: 'أحمد محمد', status: 'ready_for_printing', date: '2025-06-28', type: 'فردي' },
  { id: 1024, product: 'رداء + قبعة', customer: 'سارة علي', status: 'printing', date: '2025-06-25', type: 'فردي' },
  { id: 1021, product: 'وشاح ×45', customer: 'ممثل هندسة', status: 'ready_for_printing', date: '2025-06-20', type: 'جماعي' },
  { id: 1019, product: 'قبعة تخرج', customer: 'محمد خالد', status: 'printed', date: '2025-06-18', type: 'فردي' },
  { id: 1018, product: 'وشاح مخصص', customer: 'نورة فيصل', status: 'ready_for_delivery', date: '2025-06-15', type: 'فردي' },
]

const statusColors: Record<string, string> = {
  ready_for_printing: 'bg-cyan-50 text-cyan-700',
  printing: 'bg-purple-50 text-purple-700',
  printed: 'bg-emerald-50 text-emerald-700',
  ready_for_delivery: 'bg-green-50 text-green-700',
}

const statusLabels: Record<string, string> = {
  ready_for_printing: 'جاهز للطباعة',
  printing: 'قيد الطباعة',
  printed: 'تمت الطباعة',
  ready_for_delivery: 'جاهز للتسليم',
}

export default function EmployeeOrders() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('الكل')

  const filtered = orders.filter((o) => {
    if (filter !== 'الكل' && o.status !== filter) return false
    return search === '' || o.product.includes(search) || o.customer.includes(search) || o.id.toString().includes(search)
  })

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="employee" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/employee')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">الطلبات</h1>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warka-text-muted" />
            <input
              type="text"
              placeholder="بحث..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20"
            />
          </div>
          <div className="flex gap-2">
            {['الكل', 'ready_for_printing', 'printing', 'printed'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                  filter === f ? 'bg-warka-primary text-white' : 'bg-white text-warka-text-secondary border border-warka-border'
                }`}
              >
                {f === 'الكل' ? 'الكل' : statusLabels[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warka-bg text-warka-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">#</th>
                  <th className="px-4 py-3 text-right font-medium">المنتج</th>
                  <th className="px-4 py-3 text-right font-medium">العميل</th>
                  <th className="px-4 py-3 text-right font-medium">النوع</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium">عرض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warka-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-warka-bg/50 transition-colors">
                    <td className="px-4 py-3 text-warka-text-muted">#{o.id}</td>
                    <td className="px-4 py-3 font-medium text-warka-text">{o.product}</td>
                    <td className="px-4 py-3 text-warka-text-secondary">{o.customer}</td>
                    <td className="px-4 py-3 text-warka-text-secondary">{o.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[o.status]}`}>
                        {statusLabels[o.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-warka-text-secondary">{o.date}</td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-warka-text-muted hover:text-warka-primary transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
