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
        setUser(response.data, response.token);
        navigate('/'); 
      } else {
        alert(response.message);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  return (
    // --- CHANGED: Added bg-gray-100 ---
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      {/* --- CHANGED: bg-neutral-800 to bg-white --- */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        {/* --- CHANGED: text-white to text-neutral-900 --- */}
        <h2 className="text-3xl font-bold text-center text-neutral-900">
          Welcome back to TaskFlow
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            {/* --- CHANGED: text-neutral-300 to text-neutral-600 --- */}
            <label className="text-sm font-medium text-neutral-600">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email is required' })}
              /* --- CHANGED: text, bg, and border colors --- */
              className="w-full px-3 py-2 mt-1 text-neutral-900 bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message as string}</p>}
          </div>
          <div>
            {/* --- CHANGED: text-neutral-300 to text-neutral-600 --- */}
            <label className="text-sm font-medium text-neutral-600">Password</label>
            <input
              type="password"
              {...register('password', { required: 'Password is required' })}
              /* --- CHANGED: text, bg, and border colors --- */
              className="w-full px-3 py-2 mt-1 text-neutral-900 bg-white border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message as string}</p>}
          </div>
          <button
            type="submit"
            /* --- CHANGED: focus:ring-offset-neutral-800 to focus:ring-offset-white --- */
            className="w-full py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white"
          >
            Log In
          </button>
        </form>
        {/* --- CHANGED: text-neutral-400 to text-neutral-500 --- */}
        <p className="text-sm text-center text-neutral-500">
          Don't have an account?{' '}
          {/* --- CHANGED: text-blue-400 to text-blue-600 --- */}
          <Link to="/register" className="font-medium text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;