const USER_COLORS = ['#2563EB', '#16A34A', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export function getUserColor(index) {
  return USER_COLORS[index % USER_COLORS.length];
}

export default function UserAvatar({ email, index = 0, size = 'md' }) {
  const color = getUserColor(index);
  const initials = email
    ? email.substring(0, 2).toUpperCase()
    : '??';

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-7 h-7 text-xs',
    lg: 'w-8 h-8 text-sm',
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-medium text-white shrink-0`}
      style={{ backgroundColor: color }}
      title={email}
    >
      {initials}
    </div>
  );
}
