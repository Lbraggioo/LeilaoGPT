import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
// Update the import path below to the correct location of your api file, for example:
import resetPassword from '../lib/api';
// If your api file is located elsewhere, adjust the path accordingly.

const ResetPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Falha ao enviar email de recuperação. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Animações
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.5,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <motion.div 
        className="max-w-md w-full"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo e Título */}
        <motion.div 
          className="text-center mb-10"
          variants={itemVariants}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-blue-primary to-blue-dark rounded-full mx-auto flex items-center justify-center shadow-lg mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-primary to-blue-dark bg-clip-text text-transparent">LeilãoGPT</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Seu assistente completo em leilões do Brasil
          </p>
        </motion.div>

        {/* Card de Recuperação de Senha */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden"
          variants={itemVariants}
        >
          {/* Ilustração temática */}
          <div className="bg-gradient-to-r from-blue-light to-blue-50 dark:from-gray-700 dark:to-gray-800 p-6 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-blue-primary dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15l-3-3m0 0l3-3m-3 3h7" />
            </svg>
          </div>

          {/* Formulário */}
          <div className="p-8">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">Recuperar Senha</h2>
            
            {success ? (
              <motion.div 
                className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg mb-6"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <p className="font-medium">Email enviado com sucesso!</p>
                <p className="mt-1">Verifique sua caixa de entrada para instruções sobre como redefinir sua senha.</p>
              </motion.div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Digite seu email abaixo e enviaremos instruções para redefinir sua senha.
                </p>
                
                {error && (
                  <motion.div 
                    className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-6"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {error}
                  </motion.div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200"
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                  
                  <motion.button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-primary to-blue-dark hover:from-blue-dark hover:to-blue-primary text-white font-medium py-3 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Enviando...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                        Enviar Instruções
                      </>
                    )}
                  </motion.button>
                </form>
              </>
            )}
            
            <div className="mt-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                <Link to="/login" className="text-blue-primary hover:text-blue-dark font-medium transition-colors">
                  Voltar para o login
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
