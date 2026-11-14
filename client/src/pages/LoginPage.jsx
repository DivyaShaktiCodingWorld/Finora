
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import FormField from "../components/ui/FormField";
import Alert from "../components/ui/Alert";
import { useAuthStore } from "../store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuthStore((state) => state.login);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    clearError();
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearError();

    if (!validate()) return;

    setLoading(true);

    try {
      await login(form.email.trim(), form.password);

      navigate(location.state?.from || "/dashboard", {
        replace: true,
      });
    } catch {
      // The Zustand store provides the visible API error.
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-finora-100 text-finora-700">
          <Sparkles size={23} />
        </div>

        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-finora-600">
          Welcome back
        </p>

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Sign in to Finora<span className="text-finora-500">.</span>
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Your finances, all in one place. Let's pick up where you left off.
        </p>
      </div>

      {location.state?.registered && (
        <div className="mb-5">
          <Alert
            type="success"
            message="Your account has been created. You can now sign in."
          />
        </div>
      )}

      <div className="mb-5">
        <Alert type="error" message={error} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FormField
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={updateField}
          error={errors.email}
          icon={Mail}
          autoComplete="email"
        />

        <FormField
          label="Password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={form.password}
          onChange={updateField}
          error={errors.password}
          icon={LockKeyhole}
          autoComplete="current-password"
        />

        <div className="flex items-center gap-2.5">
          <ShieldCheck size={17} className="text-finora-600" />
          <p className="text-xs text-slate-500">
            Your account is protected with secure authentication.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="group flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-finora-800 px-5 text-sm font-bold text-white shadow-lg shadow-finora-900/15 transition-all hover:-translate-y-0.5 hover:bg-finora-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Signing you in...
            </>
          ) : (
            <>
              Sign in to your account
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6 text-center">
        <p className="text-sm text-slate-500">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-bold text-finora-700 transition hover:text-finora-500"
          >
            Create an account
          </Link>
        </p>
      </div>

      <p className="mt-7 text-center text-[11px] leading-5 text-slate-400">
        Your Money. Your Control.
      </p>
    </motion.div>
  );
}
