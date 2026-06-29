import { useNavigate, useParams } from 'react-router'
import {
  ChevronLeft,
  UserCheck,
  Plus,
  FileSpreadsheet,
  ShoppingBag,
  TrendingUp,
  Trash2,
  Edit3,
} from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

const students = [
  { id: 1, name: 'أحمد محمد', studentId: '2021001', size: 'L', status: 'confirmed', phone: '0770 111 1111' },
  { id: 2, name: 'سارة علي', studentId: '2021002', size: 'M', status: 'confirmed', phone: '0770 222 2222' },
  { id: 3, name: 'محمد خالد', studentId: '2021003', size: 'XL', status: 'pending', phone: '0770 333 3333' },
  { id: 4, name: 'نورة فيصل', studentId: '2021004', size: 'S', status: 'confirmed', phone: '0770 444 4444' },
  { id: 5, name: 'يوسف أحمد', studentId: '2021005', size: 'L', status: 'pending', phone: '0770 555 5555' },
]

export default function RepresentativeBatchDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [showAddForm, setShowAddForm] = useState(false)
  const [newStudent, setNewStudent] = useState({ name: '', studentId: '', size: 'M', phone: '' })

  const confirmedCount = students.filter((s) => s.status === 'confirmed').length

  const handleAddStudent = () => {
    if (!newStudent.name || !newStudent.studentId) {
      toast.error('أدخل الاسم والرقم الجامعي')
      return
    }
    toast.success('تم إضافة الطالب')
    setShowAddForm(false)
    setNewStudent({ name: '', studentId: '', size: 'M', phone: '' })
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="representative" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/representative/batches')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> الدفعات
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-warka-text">دفعة 2026 — هندسة</h1>
              <p className="text-sm text-warka-text-secondary mt-1">كلية الهندسة — قسم الحاسوب — {students.length} طالب</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-2 px-4 py-2 bg-warka-primary text-white text-sm rounded-xl hover:bg-warka-primary-dark transition-colors"
              >
                <Plus className="h-4 w-4" />
                إضافة طالب
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-warka-border text-warka-text text-sm rounded-xl hover:bg-white transition-colors">
                <FileSpreadsheet className="h-4 w-4" />
                استيراد
              </button>
            </div>
          </div>
        </motion.div>

        {/* Progress */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-5 shadow-card mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <span className="text-sm text-warka-text-secondary">
                <UserCheck className="h-4 w-4 inline ml-1" />
                {confirmedCount} مؤكد من {students.length}
              </span>
              <span className="text-sm text-warka-primary font-medium">
                <TrendingUp className="h-4 w-4 inline ml-1" />
                {Math.round((confirmedCount / students.length) * 100)}%
              </span>
            </div>
            <button
              onClick={() => navigate(`/representative/batches/${id}/group-order`)}
              className="flex items-center gap-2 px-4 py-2 bg-warka-accent text-white text-sm rounded-xl hover:bg-warka-accent/90 transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              طلب جماعي
            </button>
          </div>
          <div className="h-3 bg-warka-bg rounded-full overflow-hidden">
            <div className="h-full bg-warka-primary rounded-full transition-all" style={{ width: `${(confirmedCount / students.length) * 100}%` }} />
          </div>
        </motion.div>

        {/* Add Form */}
        {showAddForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white rounded-2xl p-5 shadow-card mb-6">
            <h3 className="text-sm font-bold text-warka-text mb-4">إضافة طالب جديد</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <input placeholder="الاسم" value={newStudent.name} onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })} className="px-4 py-2.5 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20" />
              <input placeholder="الرقم الجامعي" value={newStudent.studentId} onChange={(e) => setNewStudent({ ...newStudent, studentId: e.target.value })} className="px-4 py-2.5 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20" dir="ltr" />
              <select value={newStudent.size} onChange={(e) => setNewStudent({ ...newStudent, size: e.target.value })} className="px-4 py-2.5 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20">
                <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
              </select>
              <button onClick={handleAddStudent} className="px-4 py-2.5 bg-warka-primary text-white text-sm rounded-xl hover:bg-warka-primary-dark transition-colors">
                إضافة
              </button>
            </div>
          </motion.div>
        )}

        {/* Students Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-warka-bg text-warka-text-secondary">
                <tr>
                  <th className="px-4 py-3 text-right font-medium">#</th>
                  <th className="px-4 py-3 text-right font-medium">الاسم</th>
                  <th className="px-4 py-3 text-right font-medium">الرقم الجامعي</th>
                  <th className="px-4 py-3 text-right font-medium">المقاس</th>
                  <th className="px-4 py-3 text-right font-medium">الحالة</th>
                  <th className="px-4 py-3 text-right font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warka-border">
                {students.map((s, i) => (
                  <tr key={s.id} className="hover:bg-warka-bg/50 transition-colors">
                    <td className="px-4 py-3 text-warka-text-muted">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-warka-text">{s.name}</td>
                    <td className="px-4 py-3 text-warka-text-secondary" dir="ltr">{s.studentId}</td>
                    <td className="px-4 py-3 text-warka-text-secondary">{s.size}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        s.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {s.status === 'confirmed' ? 'مؤكد' : 'معلق'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="p-1.5 text-warka-text-muted hover:text-warka-primary transition-colors"><Edit3 className="h-4 w-4" /></button>
                        <button className="p-1.5 text-warka-text-muted hover:text-red-500 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
