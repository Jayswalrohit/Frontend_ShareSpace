import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useSearchParams, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, MessageCircle } from 'lucide-react';
import ChatInterface from '@/components/chat/ChatInterface';
import axios from 'axios';
import { toast } from 'sonner';

interface Chat {
  _id: string;
  participants: Array<{
    _id: string;
    name: string;
    avatar?: string;
  }>;
  listing: {
    _id: string;
    title: string;
    price: number;
    images: Array<{ url: string }>;
  };
  lastMessage: {
    content: string;
    sender: {
      _id: string;
      name: string;
    };
    timestamp: string;
  };
  unreadCount: number;
}

interface User {
  _id: string;
  name: string;
  avatar?: string;
  email: string;
}

const Chat = () => {
  const [searchParams] = useSearchParams();
  const { chatId } = useParams<{ chatId: string }>();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    if (token) {
      fetchUserData();
      fetchChats();
    }
  }, []);

  useEffect(() => {
    const sellerId = searchParams.get('seller');
    if (sellerId && chats.length > 0) {
      const chatWithSeller = chats.find(chat => 
        chat.participants.some(p => p._id === sellerId)
      );
      if (chatWithSeller) {
        setSelectedChat(chatWithSeller);
      }
    }
  }, [searchParams, chats]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setCurrentUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/chat');
      setChats(response.data);
      
      // If no chat is selected and we have chats, select the first one
      if (!selectedChat && response.data.length > 0) {
        setSelectedChat(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      toast.error('Failed to load chats');
    } finally {
      setLoading(false);
    }
  };


  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const participantNames = chat.participants
      .filter(p => p._id !== currentUser?._id)
      .map(p => p.name.toLowerCase());
    return participantNames.some(name => name.includes(searchQuery.toLowerCase())) ||
           chat.listing.title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getOtherParticipant = (chat: Chat) => {
    return chat.participants.find(p => p._id !== currentUser?._id);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login to Access Chat</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to message other users.</p>
          <Link to="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Login to Continue
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login to Access Chat</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to message other users.</p>
          <Link to="/login">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Login to Continue
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto h-full">
        <div className="grid grid-cols-1 md:grid-cols-12 h-full">
          {/* Conversations Sidebar */}
          <div className="md:col-span-4 lg:col-span-3 border-r border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-200">
              <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-y-auto h-[calc(100vh-8rem)]">
              {filteredChats.map((chat, index) => {
                const otherParticipant = getOtherParticipant(chat);
                return (
                  <motion.div
                    key={chat._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    onClick={() => setSelectedChat(chat)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat?._id === chat._id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={otherParticipant?.avatar} />
                          <AvatarFallback>
                            {otherParticipant?.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-0 -right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {otherParticipant?.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(chat.lastMessage?.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">
                          Re: {chat.listing.title}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-500 truncate">
                            {chat.lastMessage?.content}
                          </p>
                          {chat.unreadCount > 0 && (
                            <Badge className="ml-2 bg-blue-600 text-white">
                              {chat.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-8 lg:col-span-9 bg-white flex flex-col">
            {selectedChat && currentUser ? (
              <ChatInterface 
                chatId={selectedChat._id}
                currentUser={currentUser}
                otherUser={getOtherParticipant(selectedChat) || { _id: '', name: 'Unknown', avatar: '' }}
                listing={selectedChat.listing}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">No conversation selected</h3>
                  <p>Choose a conversation from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;