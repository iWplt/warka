import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

const allUsers = [
  { id: 1, name: 'أحمد محمد', email: 'ahmed@student.com', role: 'student', active: true },
  { id: 2, name: 'سارة علي', email: 'sara@student.com', role: 'student', active: true },
  { id: 3, name: 'محمد خالد', email: 'ali@student.com', role: 'student', active: true },
  { id: 4, name: 'ممثل الدفعة', email: 'rep@printshop.com', role: 'representative', active: true },
  { id: 5, name: 'المدير', email: 'admin@printshop.com', role: 'admin', active: true },
]

const roleLabels: Record<string, string> = { student: 'طالب', representative: 'ممثل', employee: 'موظف', admin: 'مدير' }
const roleColors: Record<string, string> = { student: 'bg-blue-50 text-blue-700', representative: 'bg-purple-50 text-purple-700', employee: 'bg-cyan-50 text-cyan-700', admin: 'bg-amber-50 text-amber-700' }

export default function AdminUsers() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">المستخدمون</h1>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {['الكل', 'student', 'representative', 'admin'].map((f) => (
            <div key={f} className="bg-white rounded-2xl p-4 shadow-card text-center">
              <div className="text-2xl font-bold text-warka-text">{f === 'الكل' ? allUsers.length : allUsers.filter((u) => u.role === f).length}</div>
              <div className="text-xs text-warka-text-secondary mt-1">{f === 'الكل' ? 'الكل' : roleLabels[f]}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warka-bg text-warka-text-secondary"><tr>
                <th className="px-4 py-3 text-right font-medium">#</th><th className="px-4 py-3 text-right font-medium">الاسم</th>
                <th className="px-4 py-3 text-right font-medium">البريد</th><th className="px-4 py-3 text-right font-medium">الدور</th>
                <th className="px-4 py-3 text-right font-medium">الحالة</th>
              </tr></thead>
              <tbody className="divide-y divide-warka-border">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-warka-bg/50 transition-colors">
                    <td className="px-4 py-3 text-warka-text-muted">{u.id}</td>
                    <td className="px-4 py-3 font-medium text-warka-text">{u.name}</td>
                    <td className="px-4 py-3 text-warka-text-secondary" dir="ltr">{u.email}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role]}`}>{roleLabels[u.role]}</span></td>
                    <td className="px-4 py-3">{u.active ? <span className="text-emerald-600 text-xs">نشط</span> : <span className="text-red-500 text-xs">معطل</span>}</td>
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
