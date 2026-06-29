import { useNavigate } from 'react-router'
import { ChevronLeft, CreditCard, Plus, Wallet, TrendingUp } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

const payments = [
  { id: 1, orderId: 1025, amount: 2500, method: 'زين كاش', date: '2025-06-28', type: 'partial' },
  { id: 2, orderId: 1022, amount: 3000, method: 'نقد', date: '2025-06-25', type: 'full' },
  { id: 3, orderId: 1021, amount: 100000, method: 'تحويل بنكي', date: '2025-06-22', type: 'partial' },
]

export default function AdminPayments() {
  const navigate = useNavigate()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ orderId: '', amount: '', method: 'cash' })

  const handleSubmit = () => {
    if (!form.orderId || !form.amount) { toast.error('أكمل البيانات'); return }
    toast.success('تم تسجيل الدفعة')
    setShowForm(false)
    setForm({ orderId: '', amount: '', method: 'cash' })
  }

  const totalRevenue = payments.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-warka-text">المدفوعات</h1>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-4 py-2 bg-warka-primary text-white text-sm rounded-xl hover:bg-warka-primary-dark transition-colors">
              <Plus className="h-4 w-4" /> تسجيل دفعة
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3"><Wallet className="h-5 w-5 text-emerald-600" /></div>
            <div className="text-xl font-bold">{totalRevenue.toLocaleString()} د.ع</div>
            <div className="text-xs text-warka-text-secondary mt-1">إجمالي الإيرادات</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3"><TrendingUp className="h-5 w-5 text-amber-600" /></div>
            <div className="text-xl font-bold">3</div>
            <div className="text-xs text-warka-text-secondary mt-1">عدد المدفوعات</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-card">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3"><CreditCard className="h-5 w-5 text-blue-600" /></div>
            <div className="text-xl font-bold">125,000</div>
            <div className="text-xs text-warka-text-secondary mt-1">المتبقي</div>
          </div>
        </div>

        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-2xl p-5 shadow-card mb-6">
            <h3 className="text-sm font-bold mb-4">تسجيل دفعة جديدة</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input placeholder="رقم الطلب" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="px-4 py-2.5 bg-warka-bg border border-warka-border rounded-xl text-sm" />
              <input placeholder="المبلغ" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="px-4 py-2.5 bg-warka-bg border border-warka-border rounded-xl text-sm" type="number" />
              <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} className="px-4 py-2.5 bg-warka-bg border border-warka-border rounded-xl text-sm">
                <option value="cash">نقد</option><option value="bank_transfer">تحويل بنكي</option><option value="zain_cash">زين كاش</option>
              </select>
            </div>
            <button onClick={handleSubmit} className="mt-3 px-4 py-2 bg-warka-primary text-white text-sm rounded-xl hover:bg-warka-primary-dark transition-colors">تسجيل</button>
          </motion.div>
        )}

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warka-bg text-warka-text-secondary"><tr>
                <th className="px-4 py-3 text-right font-medium">#</th><th className="px-4 py-3 text-right font-medium">الطلب</th>
                <th className="px-4 py-3 text-right font-medium">المبلغ</th><th className="px-4 py-3 text-right font-medium">الطريقة</th>
                <th className="px-4 py-3 text-right font-medium">النوع</th><th className="px-4 py-3 text-right font-medium">التاريخ</th>
              </tr></thead>
              <tbody className="divide-y divide-warka-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-warka-bg/50 transition-colors">
                    <td className="px-4 py-3 text-warka-text-muted">#{p.id}</td><td className="px-4 py-3 font-medium">#{p.orderId}</td>
                    <td className="px-4 py-3">{p.amount.toLocaleString()} د.ع</td><td className="px-4 py-3 text-warka-text-secondary">{p.method}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs ${p.type === 'full' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{p.type === 'full' ? 'كامل' : 'جزئي'}</span></td>
                    <td className="px-4 py-3 text-warka-text-secondary">{p.date}</td>
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
