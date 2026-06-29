import { useNavigate } from 'react-router'
import {
  ClipboardList,
  Clock,
  CheckCircle,
  Wallet,
  ChevronLeft,
  ShoppingBag,
  Eye,
} from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

export default function StudentDashboard() {
  const navigate = useNavigate()

  const stats = [
    { label: 'إجمالي الطلبات', value: '12', icon: ClipboardList, color: 'bg-blue-50 text-blue-600' },
    { label: 'طلبات نشطة', value: '3', icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: 'بانتظار الموافقة', value: '1', icon: CheckCircle, color: 'bg-purple-50 text-purple-600' },
    { label: 'المتبقي مالياً', value: '45,000', icon: Wallet, color: 'bg-emerald-50 text-emerald-600' },
  ]

  const recentOrders = [
    { id: 1025, product: 'وشاح تخرج', status: 'قيد التصميم', date: '2025-06-28', amount: '5,000' },
    { id: 1024, product: 'رداء + قبعة', status: 'بانتظار المراجعة', date: '2025-06-25', amount: '11,000' },
    { id: 1023, product: 'وشاح مخصص', status: 'تم التسليم', date: '2025-06-20', amount: '7,000' },
  ]

  const statusColors: Record<string, string> = {
    'قيد التصميم': 'bg-purple-50 text-purple-700',
    'بانتظار المراجعة': 'bg-amber-50 text-amber-700',
    'تم التسليم': 'bg-emerald-50 text-emerald-700',
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="student" />

      <main className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-warka-text">لوحة التحكم</h1>
          <p className="text-sm text-warka-text-secondary mt-1">نظرة عامة على طلباتك وحالتها</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card"
            >
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold text-warka-text">{s.value}</div>
              <div className="text-xs text-warka-text-secondary mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Current Order Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 shadow-card mb-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-warka-text">الطلب الحالي</h2>
              <p className="text-sm text-warka-text-secondary">طلب #1025 — وشاح تخرج</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              قيد التصميم
            </span>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-6 relative">
            <div className="absolute top-1/2 right-0 left-0 h-0.5 bg-warka-border -translate-y-1/2" />
            {['استلام', 'تصميم', 'طباعة', 'تسليم'].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i <= 1
                      ? 'bg-warka-primary text-white'
                      : 'bg-warka-bg text-warka-text-muted border border-warka-border'
                  }`}
                >
                  {i <= 1 ? <CheckCircle className="h-4 w-4" /> : i + 1}
                </div>
                <span className="text-[10px] text-warka-text-muted">{step}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/student/orders/1025')}
              className="flex-1 py-2.5 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <Eye className="h-4 w-4" />
              عرض التفاصيل
            </button>
            <button
              onClick={() => navigate('/student/tracking')}
              className="flex-1 py-2.5 border border-warka-border text-warka-text text-sm font-semibold rounded-xl hover:bg-warka-bg transition-colors"
            >
              متابعة الطلب
            </button>
          </div>
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-card overflow-hidden"
        >
          <div className="p-5 border-b border-warka-border flex items-center justify-between">
            <h2 className="text-lg font-bold text-warka-text">آخر الطلبات</h2>
            <button
              onClick={() => navigate('/student/orders')}
              className="text-sm text-warka-primary hover:underline flex items-center gap-1"
            >
              عرض الكل
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-warka-border">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => navigate(`/student/orders/${order.id}`)}
                className="p-4 flex items-center justify-between hover:bg-warka-bg/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warka-bg flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-warka-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-warka-text">{order.product}</p>
                    <p className="text-xs text-warka-text-muted">#{order.id} — {order.date}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || 'bg-gray-50 text-gray-700'}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-warka-text-muted mt-1">{order.amount} د.ع</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
