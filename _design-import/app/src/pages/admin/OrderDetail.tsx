import { useNavigate, useParams } from 'react-router'
import { ChevronLeft, User, Calendar, DollarSign, Package, MessageSquare, Printer, X, ArrowRightLeft } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

const statuses = [
  { value: 'new', label: 'جديد' },
  { value: 'pending_review', label: 'بانتظار المراجعة' },
  { value: 'designing', label: 'قيد التصميم' },
  { value: 'awaiting_approval', label: 'بانتظار الموافقة' },
  { value: 'ready_for_printing', label: 'جاهز للطباعة' },
  { value: 'printing', label: 'قيد الطباعة' },
  { value: 'printed', label: 'تمت الطباعة' },
  { value: 'ready_for_delivery', label: 'جاهز للتسليم' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'cancelled', label: 'ملغي' },
]

export default function AdminOrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [status, setStatus] = useState('designing')
  const [note, setNote] = useState('')

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus)
    toast.success(`تم تحديث الحالة إلى: ${statuses.find((s) => s.value === newStatus)?.label}`)
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin/orders')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> الطلبات
          </button>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold text-warka-text">طلب #{id}</h1>
              <p className="text-sm text-warka-text-secondary mt-1">أحمد محمد — 28 يونيو 2025</p>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              {statuses.find((s) => s.value === status)?.label}
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            {/* Order Info */}
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">معلومات الطلب</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warka-bg flex items-center justify-center"><User className="h-5 w-5 text-warka-primary" /></div>
                  <div><p className="text-xs text-warka-text-secondary">العميل</p><p className="text-sm font-medium">أحمد محمد</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warka-bg flex items-center justify-center"><Calendar className="h-5 w-5 text-warka-primary" /></div>
                  <div><p className="text-xs text-warka-text-secondary">التاريخ</p><p className="text-sm font-medium">28 يونيو 2025</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warka-bg flex items-center justify-center"><Package className="h-5 w-5 text-warka-primary" /></div>
                  <div><p className="text-xs text-warka-text-secondary">المنتج</p><p className="text-sm font-medium">وشاح تخرج</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-warka-bg flex items-center justify-center"><DollarSign className="h-5 w-5 text-warka-primary" /></div>
                  <div><p className="text-xs text-warka-text-secondary">المبلغ</p><p className="text-sm font-medium">5,000 د.ع</p></div>
                </div>
              </div>
            </div>

            {/* Change Status */}
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">تغيير الحالة</h2>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(s.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      status === s.value ? 'bg-warka-primary text-white' : 'bg-warka-bg text-warka-text-secondary hover:bg-warka-bg-dark'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">ملاحظات إدارية</h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="أضف ملاحظة..."
                rows={3}
                className="w-full px-4 py-3 bg-warka-bg border border-warka-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-warka-primary/20 resize-none"
              />
              <button onClick={() => { toast.success('تم حفظ الملاحظة'); setNote('') }} className="mt-3 px-4 py-2 bg-warka-primary text-white text-sm rounded-xl hover:bg-warka-primary-dark transition-colors">
                إضافة ملاحظة
              </button>
            </div>
          </motion.div>

          {/* Sidebar */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">إجراءات</h2>
              <div className="space-y-2">
                <button className="w-full py-2.5 bg-warka-primary text-white text-sm rounded-xl hover:bg-warka-primary-dark transition-colors flex items-center justify-center gap-2">
                  <Printer className="h-4 w-4" /> رفع معاينة
                </button>
                <button className="w-full py-2.5 border border-warka-border text-warka-text text-sm rounded-xl hover:bg-warka-bg transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" /> إرسال إشعار
                </button>
                <button className="w-full py-2.5 border border-warka-border text-warka-text text-sm rounded-xl hover:bg-warka-bg transition-colors flex items-center justify-center gap-2">
                  <ArrowRightLeft className="h-4 w-4" /> تعيين موظف
                </button>
                <button className="w-full py-2.5 border border-red-200 text-red-600 text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                  <X className="h-4 w-4" /> إلغاء الطلب
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">الدفع</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-warka-text-secondary">الحالة</span><span className="px-2 py-0.5 rounded-full text-xs bg-red-50 text-red-700">غير مدفوع</span></div>
                <div className="flex justify-between"><span className="text-warka-text-secondary">المبلغ</span><span className="font-medium">5,000 د.ع</span></div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
