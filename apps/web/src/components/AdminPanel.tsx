import { roleLabels } from "../constants";
import { useAppStore } from "../store/app-store";
import type { Role } from "../types";

const roles = Object.keys(roleLabels) as Role[];

export function AdminPanel() {
  const users = useAppStore((state) => state.users);
  const updateUser = useAppStore((state) => state.updateUser);

  return (
    <section className="mt-4 rounded-md border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-800">Пользователи и роли</h2>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">{users.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-400">
              <th className="py-2 pr-3">Пользователь</th>
              <th className="py-2 pr-3">Группа</th>
              <th className="py-2 pr-3">Роль</th>
              <th className="py-2 pr-3">Статус</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100">
                <td className="py-3 pr-3">
                  <div className="font-medium text-slate-900">{user.name}</div>
                  <div className="text-xs text-slate-500">{user.email}</div>
                </td>
                <td className="py-3 pr-3 text-slate-600">{user.group?.code ?? "—"}</td>
                <td className="py-3 pr-3">
                  <select
                    className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                    value={user.role}
                    onChange={(event) => void updateUser(user.id, { role: event.target.value as Role })}
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {roleLabels[role]}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-3 pr-3">
                  <label className="inline-flex items-center gap-2 text-slate-600">
                    <input
                      type="checkbox"
                      checked={user.active}
                      onChange={(event) => void updateUser(user.id, { active: event.target.checked })}
                    />
                    Активен
                  </label>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
