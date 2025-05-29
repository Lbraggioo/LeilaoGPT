import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/context';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);

    try {
      await register(username, email, password);
      navigate('/chat');
    } catch (err: any) {
      setError(err.message || 'Falha no cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-slate-900 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="w-full max-w-md">
        <motion.div 
          className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-8"
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">LeilãoGPT</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Crie sua conta para acessar o assistente
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="username" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                Nome de usuário
              </label>
              <input
                type="text"
                id="username"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-slate-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
                placeholder="Seu nome"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="email" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-slate-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="password" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                Senha
              </label>
              <input
                type="password"
                id="password"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-slate-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                minLength={6}
              />
            </div>
            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-gray-700 dark:text-gray-200 text-sm font-bold mb-2">
                Confirmar senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-white dark:bg-slate-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                aria-required="true"
              />
            </div>
            <div className="flex items-center justify-between mb-6">
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </motion.div>
        
        <div className="text-center mt-4">
          <p className="text-gray-600 dark:text-gray-300">
            Já tem uma conta?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Register;
