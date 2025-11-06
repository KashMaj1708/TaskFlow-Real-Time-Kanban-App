import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      const response = await api.post('/api/auth/login', {
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        // --- THIS IS THE FIX ---
        // The user is response.data
        // The token is response.token
        setUser(response.data, response.token);
        // --- END FIX ---
        
        // Redirect to dashboard
        navigate('/'); // Make sure this route exists, or change to '/boards'
      } else {
        // Handle login error
        alert(response.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-neutral-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">
          Welcome back to TaskFlow
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-neutral-300">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full px-3 py-2 mt-1 text-white bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message as string}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-neutral-300">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              className="w-full px-3 py-2 mt-1 text-white bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message as string}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
          >
            Log In
          </button>
        </form>
        <p className="text-sm text-center text-neutral-400">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-blue-400 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;