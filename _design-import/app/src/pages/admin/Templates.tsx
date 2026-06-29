import { useNavigate } from 'react-router'
import { ChevronLeft, Plus, Eye, Edit3, Trash2 } from 'lucide-react'
import PortalSidebar from '@/components/layout/PortalSidebar'
import { motion } from 'framer-motion'

const templates = [
  { id: 1, name: 'وشاح كلاسيكي', type: 'sash', active: true, preview: '/product-sash.jpg' },
  { id: 2, name: 'وشاح عصري', type: 'sash', active: true, preview: '/product-sash.jpg' },
  { id: 3, name: 'وشاح فاخر', type: 'sash', active: true, preview: '/product-sash.jpg' },
  { id: 4, name: 'قبعة أساسية', type: 'cap', active: true, preview: '/product-cap.jpg' },
  { id: 5, name: 'قبعة مميزة', type: 'cap', active: false, preview: '/product-cap.jpg' },
]

export default function AdminTemplates() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-warka-bg font-arabic lg:pr-60" dir="rtl">
      <PortalSidebar portal="admin" />

      <main className="p-4 sm:p-6 lg:p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <button onClick={() => navigate('/admin')} className="text-sm text-warka-text-secondary hover:text-warka-text mb-2 flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" /> لوحة التحكم
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-warka-text">قوالب التصميم</h1>
            <button className="flex items-center gap-2 px-4 py-2 bg-warka-primary text-white text-sm rounded-xl hover:bg-warka-primary-dark transition-colors">
              <Plus className="h-4 w-4" /> قالب جديد
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl shadow-card overflow-hidden group">
              <div className="aspect-[4/3] bg-warka-bg overflow-hidden relative">
                <img src={t.preview} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {!t.active && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><span className="text-white text-xs font-medium">معطل</span></div>}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-warka-text">{t.name}</h3>
                  <span className="text-[10px] text-warka-text-muted uppercase">{t.type}</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 py-2 border border-warka-border text-warka-text text-xs rounded-lg hover:bg-warka-bg transition-colors flex items-center justify-center gap-1">
                    <Eye className="h-3 w-3" /> معاينة
                  </button>
                  <button className="p-2 border border-warka-border text-warka-text rounded-lg hover:bg-warka-bg transition-colors">
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button className="p-2 border border-red-200 text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3 w-3" />
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
