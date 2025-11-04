import { useState, useEffect } from 'react';
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';
import { type User } from '../../types';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { X, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface MembersModalProps {
  onClose: () => void;
}

const MembersModal: React.FC<MembersModalProps> = ({ onClose }) => {
  const { activeBoard } = useBoardStore();
  const { user: currentUser } = useAuth(); // Get the currently logged-in user
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debounce search input
  useEffect(() => {
    if (search.trim().length < 2) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/users/search?query=${search}`);
        if (response.success) {
          // Filter out users who are already members
          const currentMemberIds = activeBoard?.members.map(m => m.id) || [];
          setResults(response.data.filter((user: User) => !currentMemberIds.includes(user.id)));
        }
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [search, activeBoard?.members]);

  const handleInvite = async (userId: number) => {
    if (!activeBoard) return;
    try {
      const response = await api.post(`/api/boards/${activeBoard.id}/invite`, { userId });
      if (response.success) {
        // We let the socket event handle the state update,
        // but we'll clear the search results
        setResults(results.filter(r => r.id !== userId));
      } else {
        setError(response.message || 'Failed to invite user');
      }
    } catch (err) {
      setError('An error occurred during invitation.');
    }
  };

  const handleRemove = async (userId: number) => {
    if (!activeBoard) return;
    if (userId === activeBoard.owner_id) return; // Should be impossible
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      const response = await api.delete(`/api/boards/${activeBoard.id}/members/${userId}`);
      if (!response.success) {
        setError(response.message || 'Failed to remove user');
      }
      // Socket event will handle the state update
    } catch (err) {
      setError('An error occurred during removal.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Manage Members</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        {/* Invite Users */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Invite User</h3>
          <Input
            type="text"
            placeholder="Search by username or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading && <p className="text-neutral-400 mt-2">Searching...</p>}
          <div className="mt-2 max-h-40 overflow-y-auto">
            {results.map((user) => (
             <div key={user.id} className="flex justify-between items-center p-2 hover:bg-gray-100 rounded">
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-neutral-400">{user.email}</p>
                </div>
                <Button onClick={() => handleInvite(user.id)} size="sm">Invite</Button>
              </div>
            ))}
          </div>
        </div>

        {/* Current Members */}
        <div>
          <h3 className="text-lg font-medium mb-2">Board Members</h3>
          <div className="space-y-2">
            {activeBoard?.members.map((member) => (
              <div key={member.id} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                <div>
                  <p className="font-medium">
                    {member.username} {member.id === currentUser?.id && '(You)'}
                  </p>
                  <p className="text-sm text-neutral-400 capitalize">{member.role}</p>
                </div>
                {currentUser?.id === activeBoard.owner_id && member.id !== activeBoard.owner_id && (
                  <button onClick={() => handleRemove(member.id)} className="text-neutral-400 hover:text-red-400">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MembersModal;