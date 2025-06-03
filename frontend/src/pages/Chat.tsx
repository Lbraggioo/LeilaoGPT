import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { chatAPI } from '../lib/api'
import Sidebar from '../components/Sidebar'
import ChatMessage from '../components/ChatMessage'
import LoadingDots from '../components/LoadingDots'
import type { Conversation, Message } from '../lib/api'

const Chat: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const suggestions = [
    'Analisa um edital pra mim?',
    'Sou iniciante nos leilões, quais dicas você recomenda?',
    'Como saber se um leilão é seguro?',
    'Quais documentos preciso verificar antes de arrematar?',
  ]

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    } else {
      setTheme('light')
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await chatAPI.getConversations()
        setConversations(data)
      } catch (error) {
        console.error('Erro ao carregar conversas:', error)
      }
    }
    fetchConversations()
  }, [])

  useEffect(() => {
    const loadConversation = async () => {
      if (!conversationId) {
        setCurrentConversation(null)
        setMessages([])
        return
      }

      try {
        const convId = parseInt(conversationId)
        const data = await chatAPI.getConversation(convId)
        setCurrentConversation(data)
        setMessages(data.messages)
      } catch (error) {
        console.error('Erro ao carregar conversa:', error)
        navigate('/chat')
      }
    }

    loadConversation()
  }, [conversationId])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const handleNewConversation = async () => {
    try {
      const data = await chatAPI.createConversation()
      setConversations([data, ...conversations])
      navigate(`/chat/${data.id}`)
    } catch (error) {
      console.error('Erro ao criar conversa:', error)
    }
  }

  const handleSendMessage = async (text = input) => {
    if (!text.trim()) return
    setInput('')
    setIsLoading(true)

    try {
      let conversation = currentConversation

      if (!conversation && conversationId) {
        const existing = await chatAPI.getConversation(parseInt(conversationId))
        setCurrentConversation(existing)
        setMessages(existing.messages)
        conversation = existing
      }

      if (!conversation) {
        const newConv = await chatAPI.createConversation()
        setConversations([newConv, ...conversations])
        navigate(`/chat/${newConv.id}`)
        return
      }

      const userMessage: Message = {
        id: Date.now(),
        role: 'user',
        content: text,
        created_at: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])

      const response = await chatAPI.sendMessage(conversation.id, text)
      setMessages((prev) => [...prev, response])

      const updatedConvs = await chatAPI.getConversations()
      setConversations(updatedConvs)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-screen flex bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar
        conversations={conversations}
        currentConversationId={conversationId ? parseInt(conversationId) : null}
        onNewConversation={handleNewConversation}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        setConversations={setConversations}
      />

      <motion.main
        className="flex-1 flex flex-col h-full overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors mr-2"
              aria-label="Abrir menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-primary to-blue-dark bg-clip-text text-transparent">
              {currentConversation ? currentConversation.title : 'Nova Conversa'}
            </h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {!currentConversation || (messages.length === 0 && !isLoading) ? (
            <div className="h-full flex flex-col items-center justify-center">
              <motion.div
                className="text-center max-w-2xl mx-auto"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-bold mb-4 text-blue-600 dark:text-blue-400">LeilãoGPT</h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                  Seu assistente completo em leilões do Brasil.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestions.map((suggestion, i) => (
                    <motion.button
                      key={i}
                      onClick={() => handleSendMessage(suggestion)}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow border dark:border-gray-600 text-left hover:border-blue-600 transition"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {suggestion}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <AnimatePresence>
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                {isLoading && (
                  <motion.div
                    className="flex justify-start mb-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow">
                      <LoadingDots />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="w-full p-4 pr-16 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
                disabled={isLoading}
              />
              <motion.button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className={`absolute right-3 bottom-3 p-2 rounded-full ${
                  input.trim() && !isLoading
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
                whileHover={{ scale: input.trim() && !isLoading ? 1.05 : 1 }}
                whileTap={{ scale: input.trim() && !isLoading ? 0.95 : 1 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.main>
    </div>
  )
}

export default Chat
