import type { User } from "../types";

type Props = {
  user?: Pick<User, "name" | "avatarColor"> | null;
  size?: "sm" | "md";
};

export function Avatar({ user, size = "md" }: Props) {
  const initials =
    user?.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";
  const className = size === "sm" ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";

  return (
    <span
      className={`${className} inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white`}
      style={{ backgroundColor: user?.avatarColor ?? "#64748b" }}
      title={user?.name}
    >
      {initials}
    </span>
  );
}
