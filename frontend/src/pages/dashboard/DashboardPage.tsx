import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useBoardStore } from '../../store/boardStore';
import { api } from '../../services/api';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

type CreateBoardForm = {
  title: string;
};

const DashboardPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { boards, setBoards, addBoard } = useBoardStore();
  const { register, handleSubmit, reset } = useForm<CreateBoardForm>();

  // Fetch boards on mount
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await api.get('/api/boards');
        if (response.success) {
          setBoards(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch boards:', error);
      }
    };
    fetchBoards();
  }, [setBoards]);

  // Handle create board
  const onSubmit = async (data: CreateBoardForm) => {
    try {
      const response = await api.post('/api/boards', { title: data.title });
      if (response.success) {
        addBoard(response.data); // Add to local state
        reset(); // Clear form
        navigate(`/board/${response.data.id}`); // Navigate to new board
      } else {
        alert(response.message || 'Failed to create board');
      }
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">
          Welcome, {user?.username}!
        </h1>
        <Button onClick={logout} variant="danger">
          Log Out
        </Button>
      </div>

      {/* Create New Board Form */}
      <div className="mb-8 p-4 bg-neutral-800 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Create a New Board</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="flex space-x-4">
          <Input
            placeholder="New board title..."
            registration={register('title', { required: true, minLength: 3 })}
            className="flex-grow"
          />
          <Button type="submit" variant="primary">
            Create
          </Button>
        </form>
      </div>

      {/* Board List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Boards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boards.length > 0 ? (
            boards.map((board) => (
              <Link
                to={`/board/${board.id}`}
                key={board.id}
                className="block p-6 bg-neutral-700 rounded-lg shadow hover:bg-neutral-600 transition-colors"
              >
                <h3 className="text-xl font-bold">{board.title}</h3>
                <p className="text-neutral-300">
                  {board.description || 'No description'}
                </p>
              </Link>
            ))
          ) : (
            <p className="text-neutral-400">You don't have any boards yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;