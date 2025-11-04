import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { api } from '../../services/api';
import { type Board } from '../../types';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Navbar from '../../components/layout/Navbar'; // <-- IMPORT OUR NEW NAVBAR

interface CreateBoardForm {
  title: string;
}

const DashboardPage = () => {
  const { register, handleSubmit, reset } = useForm<CreateBoardForm>();
  const [boards, setBoards] = useState<Board[]>([]);
  const [error, setError] = useState<string | null>(null);

  // (This logic is the same as before)
  const fetchBoards = async () => {
    try {
      const res = await api.get('/api/boards');
      if (res.success) {
        setBoards(res.data);
      }
    } catch (err) {
      setError('Failed to fetch boards.');
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const onSubmit = async (data: CreateBoardForm) => {
    try {
      const res = await api.post('/api/boards', data);
      if (res.success) {
        setBoards([res.data, ...boards]);
        reset();
      }
    } catch (err) {
      setError('Failed to create board.');
      console.error(err);
    }
  };

  // --- NEW LAYOUT STARTS HERE ---
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar /> {/* <-- ADDED NAVBAR */}

      {/* Page Content Container */}
      <div className="container mx-auto p-8 max-w-5xl">

        {/* Create Board Section */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Create a New Board
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-4">
            <Input
              placeholder="New board title..."
              registration={register('title', { required: true })}
              className="flex-grow"
            />
            <Button type="submit" variant="primary">
              Create
            </Button>
          </form>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>

        {/* Your Boards Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Your Boards
          </h2>
          {boards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map((board) => (
                <Link
                  to={`/board/${board.id}`}
                  key={board.id}
                  className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h3 className="text-xl font-bold text-blue-600 mb-2">
                    {board.title}
                  </h3>
                  <p className="text-gray-600">
                    {board.description || 'No description'}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <p className="text-gray-500">You haven't created any boards yet.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;