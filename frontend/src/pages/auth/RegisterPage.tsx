import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { api } from '../../services/api';

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const setUser = useAuthStore((state) => state.setUser);
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    try {
      const response = await api.post('/api/auth/register', {
        username: data.username,
        email: data.email,
        password: data.password,
      });

      if (response.success) {
        // Save user and token to store
        setUser(response.data.user, response.data.token);
        // Redirect to dashboard
        navigate('/');
      } else {
        // --- THIS IS THE UPDATED PART ---
        // Handle different error types
        let errorMessage = 'Registration failed. Please try again.';
        if (response.message) {
          // Server error or user-exists error
          errorMessage = response.message;
        } else if (response.errors && Array.isArray(response.errors)) {
          // Validation errors
          errorMessage = response.errors.map((err: any) => err.msg).join('\n');
        }
        alert(errorMessage);
        // --- END OF UPDATED PART ---
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-neutral-800 rounded-lg shadow-lg">
        <h2 className="text-3xl font-bold text-center text-white">
          Create your TaskFlow Account
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="text-sm font-medium text-neutral-300">Username</label>
            <input
              type="text"
              {...register('username', { required: 'Username is required' })}
              className="w-full px-3 py-2 mt-1 text-white bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.username && <p className="mt-1 text-xs text-red-400">{errors.username.message as string}</p>}
          </div>
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
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
              className="w-full px-3 py-2 mt-1 text-white bg-neutral-700 border border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message as string}</p>}
          </div>
          <button
            type="submit"
            className="w-full py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-800"
          >
            Create Account
          </button>
        </form>
        <p className="text-sm text-center text-neutral-400">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;