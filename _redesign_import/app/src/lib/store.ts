import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: number
  productName: string
  productImage: string
  price: number
  quantity: number
  variant?: string
  notes?: string
}

export interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'employee' | 'representative' | 'student'
  avatar?: string
}

interface AppState {
  // Auth
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  login: (user: User) => void
  logout: () => void

  // Cart
  cartItems: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (productId: number) => void
  updateQuantity: (productId: number, quantity: number) => void
  clearCart: () => void
  cartTotal: () => number
  cartCount: () => number

  // Language
  language: 'ar' | 'en'
  setLanguage: (lang: 'ar' | 'en') => void

  // Theme
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void

  // Notifications
  unreadNotifications: number
  setUnreadNotifications: (count: number) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false, cartItems: [] }),

      // Cart
      cartItems: [],
      addToCart: (item) => {
        const items = get().cartItems
        const existing = items.find((i) => i.productId === item.productId)
        if (existing) {
          set({
            cartItems: items.map((i) =>
              i.productId === item.productId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
          })
        } else {
          set({ cartItems: [...items, item] })
        }
      },
      removeFromCart: (productId) =>
        set({ cartItems: get().cartItems.filter((i) => i.productId !== productId) }),
      updateQuantity: (productId, quantity) =>
        set({
          cartItems: get().cartItems.map((i) =>
            i.productId === productId ? { ...i, quantity } : i
          ),
        }),
      clearCart: () => set({ cartItems: [] }),
      cartTotal: () =>
        get().cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      cartCount: () =>
        get().cartItems.reduce((sum, item) => sum + item.quantity, 0),

      // Language
      language: 'ar',
      setLanguage: (lang) => set({ language: lang }),

      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      // Notifications
      unreadNotifications: 3,
      setUnreadNotifications: (count) => set({ unreadNotifications: count }),
    }),
    {
      name: 'warka-store',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        cartItems: state.cartItems,
        language: state.language,
        theme: state.theme,
      }),
    }
  )
)

// Demo data
export const products = [
  {
    id: 1,
    slug: 'sash',
    nameAr: 'وشاح تخرج',
    nameEn: 'Graduation Sash',
    descriptionAr: 'وشاح مطرّز باسمك وقسمك وسنة التخرج',
    descriptionEn: 'Embroidered sash with your name, department, and graduation year',
    image: '/product-sash.jpg',
    icon: 'Award',
    price: 5000,
    hasVariants: true,
  },
  {
    id: 2,
    slug: 'gown',
    nameAr: 'رداء تخرج',
    nameEn: 'Graduation Gown',
    descriptionAr: 'رداء تخرج رسمي بجودة عالية',
    descriptionEn: 'High-quality official graduation gown',
    image: '/product-gown.jpg',
    icon: 'Shirt',
    price: 8000,
    hasVariants: true,
  },
  {
    id: 3,
    slug: 'cap',
    nameAr: 'قبعة تخرج',
    nameEn: 'Graduation Cap',
    descriptionAr: 'قبعة تخرج بمقاسات متعددة',
    descriptionEn: 'Graduation cap in multiple sizes',
    image: '/product-cap.jpg',
    icon: 'GraduationCap',
    price: 3000,
    hasVariants: true,
  },
  {
    id: 4,
    slug: 'custom',
    nameAr: 'طلب مخصص',
    nameEn: 'Custom Order',
    descriptionAr: 'طلبات خاصة مع ملاحظات وشعار اختياري',
    descriptionEn: 'Special orders with notes and optional logo',
    image: '',
    icon: 'PenTool',
    price: 2000,
    hasVariants: false,
  },
]

export const orderStatuses = {
  new: { labelAr: 'طلب جديد', labelEn: 'New Order', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  pending_review: { labelAr: 'بانتظار المراجعة', labelEn: 'Pending Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  designing: { labelAr: 'قيد التصميم', labelEn: 'Designing', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  awaiting_approval: { labelAr: 'بانتظار الموافقة', labelEn: 'Awaiting Approval', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  needs_modification: { labelAr: 'يحتاج تعديل', labelEn: 'Needs Modification', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ready_for_printing: { labelAr: 'جاهز للطباعة', labelEn: 'Ready for Printing', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  printing: { labelAr: 'قيد الطباعة', labelEn: 'Printing', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  printed: { labelAr: 'تمت الطباعة', labelEn: 'Printed', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ready_for_delivery: { labelAr: 'جاهز للتسليم', labelEn: 'Ready for Delivery', color: 'bg-green-50 text-green-700 border-green-200' },
  delivered: { labelAr: 'تم التسليم', labelEn: 'Delivered', color: 'bg-slate-50 text-slate-700 border-slate-200' },
  cancelled: { labelAr: 'ملغي', labelEn: 'Cancelled', color: 'bg-red-50 text-red-700 border-red-200' },
}

export const simplifiedStatuses = {
  pending: { labelAr: 'معلق', labelEn: 'Pending', step: 1 },
  design_review: { labelAr: 'مراجعة التصميم', labelEn: 'Design Review', step: 2 },
  approved: { labelAr: 'تمت الموافقة', labelEn: 'Approved', step: 3 },
  printing: { labelAr: 'الطباعة', labelEn: 'Printing', step: 4 },
  ready: { labelAr: 'جاهز', labelEn: 'Ready', step: 5 },
  delivered: { labelAr: 'تم التسليم', labelEn: 'Delivered', step: 6 },
}
