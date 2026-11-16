import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { Menu, Plus, Wallet } from "lucide-react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useAuthStore } from "../../store/authStore";

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((state) => state.user);

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const handleOpenAddExpense = () => {
    window.dispatchEvent(new CustomEvent("finora:open-add-expense"));
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "F";

  return (
    <div className="min-h-screen bg-[#f7faf8] text-slate-900">
      {/* ========================================================= */}
      {/* Desktop Fixed Left Sidebar Navbar (lg: >= 1024px)         */}
      {/* ========================================================= */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-72 lg:flex-col">
        <Sidebar />
      </div>

      {/* ========================================================= */}
      {/* Mobile Top Navbar (< lg screens)                          */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition active:scale-95"
            aria-label="Open sidebar menu"
          >
            <Menu size={20} />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-finora-950 text-emerald-400 shadow-xs">
              <Wallet size={18} strokeWidth={2.4} />
            </div>
            <span className="font-display text-lg font-extrabold tracking-tight text-finora-950">
              finora<span className="text-finora-500">.</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddExpense}
            className="flex items-center gap-1.5 rounded-xl bg-finora-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-finora-800"
          >
            <Plus size={15} strokeWidth={2.5} className="text-emerald-300" />
            <span className="hidden xs:inline">Add</span>
          </button>

          <div
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-finora-100 text-xs font-bold text-finora-900 border border-finora-200"
            title={user?.name || "Account"}
          >
            {userInitial}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* Mobile Drawer (Slide-out menu for mobile & tablet)        */}
      {/* ========================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop overlay */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
            aria-hidden="true"
          />

          {/* Drawer container */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 animate-slideInLeft">
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* Main Content Area (offset by left sidebar on desktop)     */}
      {/* ========================================================= */}
      <div className="flex flex-1 flex-col lg:pl-72 min-h-screen">
        <main className="flex-1">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
}