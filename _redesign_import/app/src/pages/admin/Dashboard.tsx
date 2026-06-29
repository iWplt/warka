import { useNavigate } from 'react-router'
import {
  ClipboardList,
  Palette,
  Printer,
  Truck,
  CreditCard,
  Users,
  TrendingUp,
  TrendingDown,
  ChevronLeft,

} from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const stats = [
  { label: 'إجمالي الطلبات', value: '156', icon: ClipboardList, color: 'bg-blue-50 text-blue-600', change: '+12%', up: true },
  { label: 'قيد التصميم', value: '8', icon: Palette, color: 'bg-purple-50 text-purple-600', change: '+3', up: true },
  { label: 'قيد الطباعة', value: '5', icon: Printer, color: 'bg-cyan-50 text-cyan-600', change: '-2', up: false },
  { label: 'جاهز للتسليم', value: '3', icon: Truck, color: 'bg-emerald-50 text-emerald-600', change: '+1', up: true },
  { label: 'إيرادات الشهر', value: '2.4M', icon: CreditCard, color: 'bg-amber-50 text-amber-600', change: '+15%', up: true },
  { label: 'العملاء', value: '89', icon: Users, color: 'bg-indigo-50 text-indigo-600', change: '+8', up: true },
]

const monthlyData = [
  { name: 'يناير', orders: 12 },
  { name: 'فبراير', orders: 18 },
  { name: 'مارس', orders: 25 },
  { name: 'أبريل', orders: 22 },
  { name: 'مايو', orders: 30 },
  { name: 'يونيو', orders: 35 },
]

const paymentData = [
  { name: 'مدفوع', value: 65, color: '#4CAF50' },
  { name: 'جزئي', value: 20, color: '#FF9800' },
  { name: 'غير مدفوع', value: 15, color: '#f44336' },
]

const recentOrders = [
  { id: 1025, customer: 'أحمد محمد', product: 'وشاح تخرج', status: 'قيد التصميم', amount: 5000 },
  { id: 1024, customer: 'سارة علي', product: 'رداء + قبعة', status: 'قيد الطباعة', amount: 11000 },
  { id: 1023, customer: 'ممثل هندسة', product: 'وشاح ×45', status: 'جاهز للطباعة', amount: 225000 },
  { id: 1022, customer: 'محمد خالد', product: 'قبعة تخرج', status: 'تم التسليم', amount: 3000 },
]

const statusColors: Record<string, string> = {
  'قيد التصميم': 'bg-purple-50 text-purple-700',
  'قيد الطباعة': 'bg-cyan-50 text-cyan-700',
  'جاهز للطباعة': 'bg-amber-50 text-amber-700',
  'تم التسليم': 'bg-emerald-50 text-emerald-700',
}

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-bold text-warka-text">لوحة التحكم</h1>
          <p className="text-sm text-warka-text-secondary mt-1">نظرة عامة على أداء المتجر</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-card"
            >
              <div className={`w-9 h-9 rounded-lg ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="text-xl font-bold text-warka-text">{s.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <span className={`text-[10px] font-medium ${s.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {s.up ? <TrendingUp className="h-3 w-3 inline" /> : <TrendingDown className="h-3 w-3 inline" />}
                  {s.change}
                </span>
              </div>
              <div className="text-[11px] text-warka-text-secondary mt-0.5">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-warka-text mb-4">الطلبات الشهرية</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9E9E9E' }} axisLine={false} tickLine={false} />
                <Bar dataKey="orders" fill="#5C5C47" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl p-5 shadow-card">
            <h2 className="text-base font-bold text-warka-text mb-4">توزيع المدفوعات</h2>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={paymentData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" stroke="none">
                    {paymentData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="mr-6 space-y-2">
                {paymentData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                    <span className="text-warka-text-secondary">{d.name}</span>
                    <span className="font-medium text-warka-text">{d.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Orders */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="p-5 border-b border-warka-border flex items-center justify-between">
            <h2 className="text-base font-bold text-warka-text">آخر الطلبات</h2>
            <button onClick={() => navigate('/admin/orders')} className="text-sm text-warka-primary hover:underline flex items-center gap-1">
              عرض الكل <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="divide-y divide-warka-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between hover:bg-warka-bg/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-warka-bg flex items-center justify-center">
                    <ClipboardList className="h-4 w-4 text-warka-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-warka-text">#{order.id} — {order.product}</p>
                    <p className="text-xs text-warka-text-muted">{order.customer}</p>
                  </div>
                </div>
                <div className="text-left">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {order.status}
                  </span>
                  <p className="text-xs text-warka-text-muted mt-1">{order.amount.toLocaleString()} د.ع</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  )
}
