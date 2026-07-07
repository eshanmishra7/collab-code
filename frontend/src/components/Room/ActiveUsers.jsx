import { memo } from 'react';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];

const Avatar = ({ name, color }) => (
  <div
    title={name}
    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white -ml-2 first:ml-0 border-2 border-gray-900"
    style={{ backgroundColor: color }}
  >
    {name?.[0]?.toUpperCase()}
  </div>
);

const ActiveUsers = memo(({ users = [] }) => (
  <div className="flex items-center">
    {users.slice(0, 6).map((u, i) => (
      <Avatar key={u.socketId || i} name={u.name} color={u.color || COLORS[i % COLORS.length]} />
    ))}
    {users.length > 6 && (
      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-300 -ml-2 border-2 border-gray-900">
        +{users.length - 6}
      </div>
    )}
    <span className="text-xs text-gray-500 ml-2">
      {users.length} online
    </span>
  </div>
));

export default ActiveUsers;