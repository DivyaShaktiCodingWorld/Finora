
function calculateStrength(password) {
  if (!password) return 0;

  let score = 0;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  return score;
}

export default function PasswordStrength({ password }) {
  if (!password) return null;

  const strength = calculateStrength(password);

  const labels = [
    "Very weak",
    "Weak",
    "Fair",
    "Good",
    "Strong",
  ];

  const colors = [
    "bg-red-400",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-finora-400",
    "bg-finora-600",
  ];

  return (
    <div className="mt-3">
      <div className="mb-2 flex justify-between">
        <span className="text-xs text-slate-500">
          Password strength
        </span>

        <span className="text-xs font-bold text-slate-600">
          {labels[Math.max(0, strength - 1)]}
        </span>
      </div>

      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1.5 flex-1 rounded-full ${
              strength >= level ? colors[strength - 1] : "bg-slate-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
