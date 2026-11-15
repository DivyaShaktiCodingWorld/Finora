
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import FormField from "../components/ui/FormField";
import Alert from "../components/ui/Alert";
import { useAuthStore } from "../store/authStore";

function getPasswordStrength(password) {
  if (!password) return 0;

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

export default function RegisterPage() {
  const navigate = useNavigate();

  const register = useAuthStore((state) => state.register);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password]
  );

  const strengthLabel = [
    "Enter a password",
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ][passwordStrength];

  const strengthColor =
    passwordStrength <= 1
      ? "bg-red-400"
      : passwordStrength === 2
        ? "bg-orange-400"
        : passwordStrength === 3
          ? "bg-yellow-400"
          : passwordStrength === 4
            ? "bg-finora-400"
            : "bg-finora-600";

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

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your full name.";
    } else if (form.name.trim().length < 2) {
      nextErrors.name = "Name must contain at least 2 characters.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Please create a password.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    } else if (new TextEncoder().encode(form.password).length > 72) {
      nextErrors.password = "Password is too long.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!acceptedTerms) {
      nextErrors.terms = "Please accept the terms to continue.";
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
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate("/dashboard", { replace: true });
    } catch {
      // The Zustand store displays the API error.
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
      <div className="mb-7">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-finora-100 text-finora-700">
          <Sparkles size={23} />
        </div>

        <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-finora-600">
          Get started today
        </p>

        <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Create your account<span className="text-finora-500">.</span>
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-500">
          Start building better money habits with your personal finance
          companion.
        </p>
      </div>

      <div className="mb-4">
        <Alert type="error" message={error} />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Full name"
          name="name"
          placeholder="Enter your full name"
          value={form.name}
          onChange={updateField}
          error={errors.name}
          icon={UserRound}
          autoComplete="name"
        />

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

        <div>
          <FormField
            label="Create password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={updateField}
            error={errors.password}
            icon={LockKeyhole}
            autoComplete="new-password"
          />

          {form.password && (
            <div className="mt-3">
              <div className="mb-2 flex justify-between">
                <span className="text-xs font-medium text-slate-500">
                  Password strength
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {strengthLabel}
                </span>
              </div>

              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      passwordStrength >= level
                        ? strengthColor
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                Combine uppercase, lowercase, numbers and symbols
                to strengthen your password.
              </p>
            </div>
          )}
        </div>

        <FormField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          placeholder="Enter your password again"
          value={form.confirmPassword}
          onChange={updateField}
          error={errors.confirmPassword}
          icon={LockKeyhole}
          autoComplete="new-password"
        />

        <div className="pt-1">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => {
                setAcceptedTerms(event.target.checked);
                setErrors((previous) => ({
                  ...previous,
                  terms: "",
                }));
              }}
              className="mt-0.5 h-4 w-4 shrink-0 accent-finora-700"
            />

            <span className="text-xs leading-5 text-slate-500">
              I agree to the terms of use and acknowledge the privacy
              policy.
            </span>
          </label>

          {errors.terms && (
            <p className="mt-2 text-xs font-medium text-red-500">
              {errors.terms}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-finora-50 p-3">
          <ShieldCheck size={18} className="shrink-0 text-finora-700" />
          <p className="text-xs text-finora-800">
            Your password is securely hashed on the server.
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
              Creating account...
            </>
          ) : (
            <>
              Create my account
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      <div className="mt-7 border-t border-slate-200 pt-6 text-center">
        <p className="text-sm text-slate-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-bold text-finora-700 transition hover:text-finora-500"
          >
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
