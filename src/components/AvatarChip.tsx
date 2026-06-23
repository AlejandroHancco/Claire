'use client';

interface AvatarChipProps {
  displayName: string;
  avatarColor: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  if (!name?.trim()) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

const sizeMap = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
};

export default function AvatarChip({ displayName, avatarColor, avatarUrl, size = 'sm', showName = true, className = '' }: AvatarChipProps) {
  const initials = getInitials(displayName);
  const hex = avatarColor || '#6366f1';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={`${sizeMap[size]} rounded-full object-cover flex-shrink-0`}
          style={{ border: `1px solid ${hex}55` }}
        />
      ) : (
        <div
          className={`${sizeMap[size]} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
          style={{
            backgroundColor: `${hex}26`,
            border: `1px solid ${hex}55`,
            color: hex,
          }}
        >
          {initials}
        </div>
      )}
      {showName && (
        <span className="text-gray-200 text-sm truncate">{displayName}</span>
      )}
    </div>
  );
}
