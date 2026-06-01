import { useState } from "react";
import { BookOpenCheck, LogIn, ShieldCheck } from "lucide-react";
import { demoAccounts } from "../constants";
import { useAuthStore } from "../store/auth-store";

export function LoginPage() {
  const { login, loading, error } = useAuthStore();
  const [email, setEmail] = useState(demoAccounts[5].email);
  const [password, setPassword] = useState(demoAccounts[5].password);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-soft lg:grid-cols-[1fr_420px]">
        <div className="flex flex-col justify-between bg-slate-950 p-8 text-white">
          <div>
            <div className="mb-8 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-400 text-slate-950">
              <BookOpenCheck size={26} aria-hidden />
            </div>
            <h1 className="text-4xl font-semibold tracking-normal">EduKanban</h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300">
              Учебная канбан-доска для группы: задачи, роли, дедлайны, комментарии, прогресс и демо-аналитика.
            </p>
          </div>
          <div className="mt-10 grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <span className="rounded-md border border-slate-700 px-3 py-2">JWT + RBAC</span>
            <span className="rounded-md border border-slate-700 px-3 py-2">Kanban DnD</span>
            <span className="rounded-md border border-slate-700 px-3 py-2">AI helper</span>
          </div>
        </div>

        <form
          className="p-8"
          onSubmit={(event) => {
            event.preventDefault();
            void login(email, password);
          }}
        >
          <div className="mb-6 flex items-center gap-3">
            <ShieldCheck className="text-emerald-600" size={24} aria-hidden />
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Вход в систему</h2>
              <p className="text-sm text-slate-500">Выберите демо-роль или введите учетные данные.</p>
            </div>
          </div>

          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
            />
          </label>

          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Пароль</span>
            <input
              className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
            />
          </label>

          {error && <p className="mb-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            <LogIn size={18} aria-hidden />
            {loading ? "Входим..." : "Войти"}
          </button>

          <div className="mt-6 grid grid-cols-2 gap-2">
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                className="rounded-md border border-slate-200 px-3 py-2 text-left text-sm transition hover:border-emerald-300 hover:bg-emerald-50"
                type="button"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                }}
              >
                <span className="block font-medium text-slate-800">{account.label}</span>
                <span className="block truncate text-xs text-slate-500">{account.email}</span>
              </button>
            ))}
          </div>
        </form>
      </section>
    </main>
  );
}
