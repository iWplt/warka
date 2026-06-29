import { useNavigate, useParams } from 'react-router'
import {
  ChevronLeft,
  ShoppingBag,
  CheckCircle,
  Clock,
  Printer,
  Truck,
  X,
  Download,
  MessageSquare,
} from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

const timeline = [
  { status: 'تم استلام الطلب', date: '2025-06-28 10:30', done: true, icon: ShoppingBag },
  { status: 'قيد المراجعة', date: '2025-06-28 14:00', done: true, icon: Clock },
  { status: 'قيد التصميم', date: '2025-06-29 09:00', done: true, icon: Printer, current: true },
  { status: 'جاهز للطباعة', date: '', done: false, icon: CheckCircle },
  { status: 'قيد الطباعة', date: '', done: false, icon: Printer },
  { status: 'جاهز للاستلام', date: '', done: false, icon: Truck },
  { status: 'تم التسليم', date: '', done: false, icon: CheckCircle },
]

export default function StudentOrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="student" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/student/orders')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> طلباتي
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-warka-text">طلب #{id}</h1>
              <p className="text-sm text-warka-text-secondary mt-1">وشاح تخرج — 28 يونيو 2025</p>
            </div>
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              قيد التصميم
            </span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">تتبع الطلب</h2>
              <div className="space-y-0">
                {timeline.map((item, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i < timeline.length - 1 && (
                      <div className={`absolute right-4 top-10 w-0.5 h-full ${item.done ? 'bg-warka-primary' : 'bg-warka-border'}`} />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      item.done ? 'bg-warka-primary text-white' : item.current ? 'bg-warka-primary text-white ring-4 ring-warka-primary/20' : 'bg-warka-bg text-warka-text-muted border border-warka-border'
                    }`}>
                      <item.icon className="h-4 w-4" />
                    </div>
                    <div className="pb-6">
                      <p className={`text-sm font-medium ${item.done || item.current ? 'text-warka-text' : 'text-warka-text-muted'}`}>
                        {item.status}
                      </p>
                      {item.date && <p className="text-xs text-warka-text-muted mt-0.5">{item.date}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Design Preview */}
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">معاينة التصميم</h2>
              <div className="bg-warka-bg rounded-xl p-8 text-center">
                <img src="/product-sash.jpg" alt="Design Preview" className="h-40 mx-auto object-contain mb-4" />
                <p className="text-sm text-warka-text-secondary">تصميم الوشاح — النسخة الأولى</p>
                <div className="flex gap-3 justify-center mt-4">
                  <button className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
                    موافقة
                  </button>
                  <button className="px-4 py-2 bg-white border border-warka-border text-warka-text text-sm font-medium rounded-lg hover:bg-warka-bg transition-colors">
                    طلب تعديل
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Sidebar Info */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">تفاصيل الطلب</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-warka-text-secondary">المنتج</span>
                  <span className="font-medium">وشاح تخرج</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warka-text-secondary">الكمية</span>
                  <span className="font-medium">1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warka-text-secondary">السعر</span>
                  <span className="font-medium">5,000 د.ع</span>
                </div>
                <div className="border-t border-warka-border pt-3 flex justify-between">
                  <span className="font-bold">الإجمالي</span>
                  <span className="font-bold">5,000 د.ع</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">الدفع</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-warka-text-secondary">الحالة</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">غير مدفوع</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-warka-text-secondary">المبلغ المستحق</span>
                  <span className="font-medium">5,000 د.ع</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-card">
              <h2 className="text-base font-bold text-warka-text mb-4">الإجراءات</h2>
              <div className="space-y-2">
                <button className="w-full py-2.5 border border-warka-border text-warka-text text-sm rounded-xl hover:bg-warka-bg transition-colors flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  تحميل الفاتورة
                </button>
                <button className="w-full py-2.5 border border-warka-border text-warka-text text-sm rounded-xl hover:bg-warka-bg transition-colors flex items-center justify-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  تواصل مع الدعم
                </button>
                <button className="w-full py-2.5 border border-red-200 text-red-600 text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
                  <X className="h-4 w-4" />
                  إلغاء الطلب
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
