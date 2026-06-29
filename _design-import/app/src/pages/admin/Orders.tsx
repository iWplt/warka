import { useNavigate } from 'react-router'
import { ChevronLeft, Search, Eye, ArrowDownToLine } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'

const allOrders = [
  { id: 1025, customer: 'أحمد محمد', product: 'وشاح تخرج', type: 'فردي', status: 'designing', amount: 5000, date: '2025-06-28' },
  { id: 1024, customer: 'سارة علي', product: 'رداء + قبعة', type: 'فردي', status: 'printing', amount: 11000, date: '2025-06-25' },
  { id: 1023, customer: 'ممثل هندسة', product: 'وشاح ×45', type: 'جماعي', status: 'ready_for_printing', amount: 225000, date: '2025-06-22' },
  { id: 1022, customer: 'محمد خالد', product: 'قبعة تخرج', type: 'فردي', status: 'delivered', amount: 3000, date: '2025-06-20' },
  { id: 1021, customer: 'نورة فيصل', product: 'وشاح مخصص', type: 'فردي', status: 'delivered', amount: 7000, date: '2025-06-18' },
  { id: 1020, customer: 'يوسف أحمد', product: 'طلب مخصص', type: 'فردي', status: 'cancelled', amount: 2000, date: '2025-06-15' },
  { id: 1019, customer: 'ممثل طب', product: 'وشاح ×32', type: 'جماعي', status: 'pending_review', amount: 160000, date: '2025-06-12' },
]

const statusMap: Record<string, { label: string; color: string }> = {
  new: { label: 'جديد', color: 'bg-blue-50 text-blue-700' },
  pending_review: { label: 'بانتظار المراجعة', color: 'bg-amber-50 text-amber-700' },
  designing: { label: 'قيد التصميم', color: 'bg-purple-50 text-purple-700' },
  awaiting_approval: { label: 'بانتظار الموافقة', color: 'bg-indigo-50 text-indigo-700' },
  ready_for_printing: { label: 'جاهز للطباعة', color: 'bg-cyan-50 text-cyan-700' },
  printing: { label: 'قيد الطباعة', color: 'bg-teal-50 text-teal-700' },
  printed: { label: 'تمت الطباعة', color: 'bg-emerald-50 text-emerald-700' },
  ready_for_delivery: { label: 'جاهز للتسليم', color: 'bg-green-50 text-green-700' },
  delivered: { label: 'تم التسليم', color: 'bg-slate-50 text-slate-700' },
  cancelled: { label: 'ملغي', color: 'bg-red-50 text-red-700' },
}

export default function AdminOrders() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('الكل')

  const filtered = allOrders.filter((o) => {
    if (typeFilter !== 'الكل' && o.type !== typeFilter) return false
    return search === '' || o.product.includes(search) || o.customer.includes(search) || o.id.toString().includes(search)
  })

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-warka-text">الطلبات</h1>
            <button className="flex items-center gap-2 px-4 py-2 border border-warka-border text-warka-text text-sm rounded-xl hover:bg-white transition-colors">
              <ArrowDownToLine className="h-4 w-4" />
              تصدير
            </button>
          </div>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-warka-text-muted" />
            <input type="text" placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-white border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20" />
          </div>
          <div className="flex gap-2">
            {['الكل', 'فردي', 'جماعي'].map((f) => (
              <button key={f} onClick={() => setTypeFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${typeFilter === f ? 'bg-warka-primary text-white' : 'bg-white text-warka-text-secondary border border-warka-border'}`}>
                {f}
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
                  <th className="px-4 py-3 text-right font-medium">العميل</th>
                  <th className="px-4 py-3 text-right font-medium">المنتج</th>
                  <th className="px-4 py-3 text-right font-medium">النوع</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">المبلغ</th>
                  <th className="px-4 py-3 text-right font-medium">التاريخ</th>
                  <th className="px-4 py-3 text-right font-medium">عرض</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warka-border">
                {filtered.map((o) => (
                  <tr key={o.id} className="hover:bg-warka-bg/50 transition-colors">
                    <td className="px-4 py-3 text-warka-text-muted">#{o.id}</td>
                    <td className="px-4 py-3 font-medium text-warka-text">{o.customer}</td>
                    <td className="px-4 py-3 text-warka-text-secondary">{o.product}</td>
                    <td className="px-4 py-3 text-warka-text-secondary">{o.type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[o.status]?.color || ''}`}>
                        {statusMap[o.status]?.label || o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-warka-text">{o.amount.toLocaleString()} د.ع</td>
                    <td className="px-4 py-3 text-warka-text-secondary">{o.date}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/admin/orders/${o.id}`)} className="p-1.5 text-warka-text-muted hover:text-warka-primary transition-colors">
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
