import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Premium Glassmorphism Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/75 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-sm shadow-slate-100/35">
        <div className="mx-auto max-w-7xl flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-emerald-800">
            <span className="text-2xl animate-pulse">🌱</span>
            <span className="font-black">Sasya Khetr</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-teal-50/20 to-white py-20 px-4 sm:px-6 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.emerald.100),theme(colors.white))] opacity-40"></div>
          
          <div className="mx-auto max-w-4xl text-center">
            {/* Animated Micro-Badge */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/60 px-4 py-1.5 text-xs font-bold text-emerald-850 border border-emerald-200/50 mb-6 animate-bounce">
              <span>🌾</span> Direct Local Farm Connection
            </span>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
              Harvest Freshness Directly From <span className="text-emerald-700 bg-clip-text">Sasya Khetr</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
              Connect directly with organic farmers, pre-order sustainable chemical-free crops, and enjoy direct-to-home fresh seasonal logistics.
            </p>

            {/* Interactive Call-To-Action Area */}
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/customer/dashboard"
                className="px-8 py-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-2xl font-black transition shadow-md hover:shadow-lg active:scale-[0.98] text-base flex items-center gap-2"
              >
                🔍 Browse Products
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-black transition shadow-lg shadow-emerald-700/25 hover:shadow-xl active:scale-[0.98] text-base flex items-center gap-2"
              >
                🔐 Sign In to Dashboard
              </Link>
              <Link
                href="/auth/register"
                className="px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition shadow-lg shadow-slate-900/20 hover:shadow-xl active:scale-[0.98] text-base flex items-center gap-2"
              >
                🌾 Join Us Today
              </Link>
            </div>

            {/* Trust highlights metrics */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-6 max-w-3xl mx-auto border-t border-slate-100 pt-12">
              <div className="p-4 bg-white/40 rounded-2xl border border-slate-100/50 backdrop-blur-sm shadow-sm hover:shadow-md transition">
                <span className="block text-3xl font-black text-emerald-850">100%</span>
                <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-450 mt-1 block">Certified Organic</span>
              </div>
              <div className="p-4 bg-white/40 rounded-2xl border border-slate-100/50 backdrop-blur-sm shadow-sm hover:shadow-md transition">
                <span className="block text-3xl font-black text-emerald-850">Direct</span>
                <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-450 mt-1 block">Farmer Income</span>
              </div>
              <div className="col-span-2 md:col-span-1 p-4 bg-white/40 rounded-2xl border border-slate-100/50 backdrop-blur-sm shadow-sm hover:shadow-md transition">
                <span className="block text-3xl font-black text-emerald-850">₹0 Fee</span>
                <span className="text-xxs uppercase tracking-wider font-extrabold text-slate-450 mt-1 block">Hidden Charges</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature listings */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-sm font-extrabold text-emerald-700 uppercase tracking-wider">How Sasya Khetr Works</h2>
            <p className="text-3xl font-black text-slate-900 tracking-tight mt-2">Revolutionizing local farm logistics</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative rounded-3xl bg-white border border-slate-150 p-8 shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition"></div>
              <div>
                <span className="text-4xl block mb-6 filter drop-shadow">🌱</span>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3">Fresh Harvest</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Browse real-time active inventory harvested fresh from certified crops inside Sasya Khetr farms.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative rounded-3xl bg-white border border-slate-150 p-8 shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-10 group-hover:scale-110 transition"></div>
              <div>
                <span className="text-4xl block mb-6 filter drop-shadow">👨‍🌾</span>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3">Fair Compensation</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Eliminate commercial middlemen. Directly support local farmers with absolute pricing transparency.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative rounded-3xl bg-white border border-slate-150 p-8 shadow-sm hover:shadow-xl transition duration-300 flex flex-col justify-between overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-sky-50 rounded-bl-full -z-10 group-hover:scale-110 transition"></div>
              <div>
                <span className="text-4xl block mb-6 filter drop-shadow">📦</span>
                <h3 className="text-xl font-extrabold text-slate-900 mb-3">Pre-Order Invoices</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Pay securely online, generate high-fidelity printable pre-order receipts, and trace order statuses directly.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Premium Footer */}
      <footer className="border-t border-slate-100 bg-white py-12 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-400 font-semibold">
        <p>© 2026 Sasya Khetr Organic Farm. All rights reserved.</p>
        <p className="mt-2 text-slate-350">Made with care for sustainable community agriculture.</p>
      </footer>
    </div>
  )
}
