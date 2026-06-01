import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Dashboard } from "./components/Dashboard";
import { LoginPage } from "./components/LoginPage";
import { useAuthStore } from "./store/auth-store";

export default function App() {
  const { user, loading, bootstrap } = useAuthStore();

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  if (loading && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        <Loader2 className="mr-2 animate-spin" size={20} aria-hidden />
        Загрузка...
      </main>
    );
  }

  return user ? <Dashboard /> : <LoginPage />;
}
