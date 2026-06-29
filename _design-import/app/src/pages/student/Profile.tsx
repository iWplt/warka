import { useNavigate } from 'react-router'
import { ChevronLeft, User, Save } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function StudentProfile() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: 'أحمد محمد',
    email: 'ahmed@student.com',
    phone: '0770 000 0000',
    college: 'كلية الهندسة',
    department: 'قسم الحاسوب',
    graduationYear: '2026',
    size: 'L',
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    toast.success('تم حفظ التغييرات بنجاح')
    setSaving(false)
  }

  const fields = [
    { label: 'الاسم الكامل', key: 'name', type: 'text' },
    { label: 'البريد الإلكتروني', key: 'email', type: 'email' },
    { label: 'رقم الهاتف', key: 'phone', type: 'tel' },
    { label: 'الكلية', key: 'college', type: 'text' },
    { label: 'القسم', key: 'department', type: 'text' },
    { label: 'سنة التخرج', key: 'graduationYear', type: 'number' },
    { label: 'المقاس', key: 'size', type: 'text' },
  ]

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="student" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/student')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">الملف الشخصي</h1>
        </motion.div>

        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl p-6 shadow-card">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-full bg-warka-primary flex items-center justify-center text-white text-xl font-bold">
                <User className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-warka-text">{form.name}</h2>
                <p className="text-sm text-warka-text-secondary">طالب — {form.college}</p>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-warka-text mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as Record<string, string>)[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    className="w-full px-4 py-2.5 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 focus:border-warka-primary"
                    dir={field.type === 'email' || field.type === 'tel' || field.type === 'number' ? 'ltr' : 'rtl'}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 bg-warka-primary text-white text-sm font-semibold rounded-xl hover:bg-warka-primary-dark transition-colors disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              حفظ التغييرات
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
