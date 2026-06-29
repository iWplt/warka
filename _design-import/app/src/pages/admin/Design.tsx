import { useNavigate } from 'react-router'
import { ChevronLeft, Palette, UploadCloud, Eye, CheckCircle } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'
import { useState } from 'react'
import toast from 'react-hot-toast'

const designQueue = [
  { id: 1025, customer: 'أحمد محمد', product: 'وشاح تخرج', status: 'designing', date: '2025-06-28' },
  { id: 1024, customer: 'سارة علي', product: 'رداء تخرج', status: 'needs_modification', date: '2025-06-25' },
  { id: 1021, customer: 'ممثل هندسة', product: 'وشاح ×45', status: 'designing', date: '2025-06-22' },
]

export default function AdminDesign() {
  const navigate = useNavigate()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
        toast.success('تم رفع المعاينة')
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <h1 className="text-2xl font-bold text-warka-text">طابور التصميم</h1>
        </motion.div>

        <div className="space-y-4">
          {designQueue.map((item, i) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl p-5 shadow-card">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Palette className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-warka-text">#{item.id} — {item.product}</p>
                    <p className="text-xs text-warka-text-muted">{item.customer} — {item.date}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.status === 'designing' ? 'bg-purple-50 text-purple-700' : 'bg-orange-50 text-orange-700'
                }`}>
                  {item.status === 'designing' ? 'قيد التصميم' : 'يحتاج تعديل'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border-2 border-dashed border-warka-border rounded-xl p-6 text-center hover:border-warka-primary/50 transition-colors relative">
                  <input type="file" accept="image/*" onChange={handleUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-32 mx-auto object-contain" />
                  ) : (
                    <><UploadCloud className="h-8 w-8 text-warka-text-muted mx-auto mb-2" /><p className="text-sm text-warka-text-secondary">اضغط لرفع المعاينة</p></>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => toast.success('تم إرسال المعاينة للعميل')} className="flex-1 py-2.5 bg-warka-primary text-white text-sm rounded-xl hover:bg-warka-primary-dark transition-colors flex items-center justify-center gap-2">
                    <Eye className="h-4 w-4" /> إرسال للموافقة
                  </button>
                  <button onClick={() => toast.success('تمت الموافقة على التصميم')} className="flex-1 py-2.5 bg-emerald-500 text-white text-sm rounded-xl hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="h-4 w-4" /> موافقة مباشرة
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}
