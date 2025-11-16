import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Send, Image, Mic, Paperclip, Trash2, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import io from 'socket.io-client';

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
  messageType?: string;
  readBy?: Array<{
    user: string;
    readAt: string;
  }>;
}

interface ChatInterfaceProps {
  chatId: string;
  currentUser: {
    _id: string;
    name: string;
    avatar?: string;
  };
  otherUser: {
    _id: string;
    name: string;
    avatar?: string;
  };
  listing?: {
    _id: string;
    title: string;
    price: number;
    images: Array<{ url: string }>;
  };
}

const ChatInterface = ({ chatId, currentUser, otherUser, listing }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize socket connection
    socket.current = io('http://localhost:5000');

    socket.current.emit('join-user', currentUser._id);
    socket.current.emit('join-chat', chatId);

    // Listen for new messages
    socket.current.on('new-message', (data: any) => {
      setMessages(prev => [...prev, data.message]);
    });

    // Listen for typing indicators
    socket.current.on('user-typing', (data: any) => {
      if (data.userId !== currentUser._id) {
        setOtherUserTyping(true);
      }
    });

    socket.current.on('user-stop-typing', (data: any) => {
      if (data.userId !== currentUser._id) {
        setOtherUserTyping(false);
      }
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [chatId, currentUser._id]);

  useEffect(() => {
    fetchMessages();
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chat/${chatId}`);
      setMessages(response.data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);
      await axios.post(`/api/chat/${chatId}/message`, { content: newMessage });
      setNewMessage('');
      setIsTyping(false);
      socket.current?.emit('stop-typing', { chatId, userId: currentUser._id });
      await fetchMessages(); // Refresh messages
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socket.current?.emit('start-typing', { chatId, userId: currentUser._id });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.current?.emit('stop-typing', { chatId, userId: currentUser._id });
    }, 1000);
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await axios.delete(`/api/chat/${chatId}/message/${messageId}`);
      await fetchMessages();
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    }
  };

  const handleImageUpload = () => {
    imageInputRef.current?.click();
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleVoiceRecord = () => {
    // Voice recording functionality would go here
    toast.info('Voice recording feature coming soon!');
  };

  const onImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('attachments', file);
      formData.append('content', 'Sent an image');
      formData.append('messageType', 'file');

      await axios.post(`/api/chat/${chatId}/message/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchMessages();
      toast.success('Image sent');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to send image');
    }
  };

  const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size should be less than 10MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('attachments', file);
      formData.append('content', `Sent a file: ${file.name}`);
      formData.append('messageType', 'file');

      await axios.post(`/api/chat/${chatId}/message/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await fetchMessages();
      toast.success('File sent');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to send file');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) {
      return 'Just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="chat-container w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl mx-auto h-screen bg-white flex flex-col">
      {/* Chat Header */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-2 sm:p-4">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
            <AvatarImage src={otherUser.avatar} />
            <AvatarFallback className="text-xs sm:text-sm">
              {otherUser.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{otherUser.name}</h2>
            <p className="text-xs sm:text-sm text-gray-500">
              {otherUserTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>

        {/* Listing Context */}
        {listing && (
          <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <img
                src={listing.images[0]?.url || '/placeholder-image.jpg'}
                alt="Product"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-cover flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-gray-900 text-sm sm:text-base truncate">{listing.title}</h4>
                <p className="text-xs sm:text-sm text-gray-600">₹{(listing.price * 83).toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages - Full height scrolling */}
      <div className="messages flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-sm sm:text-lg mb-2">No messages yet</p>
              <p className="text-xs sm:text-sm">Start a conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message._id || index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`message flex w-full mb-3 sm:mb-4 px-1 sm:px-2 ${
                message.sender._id === currentUser._id ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.sender._id !== currentUser._id && (
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 flex-shrink-0">
                  <AvatarImage src={message.sender.avatar} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {message.sender.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}

              <div className={`flex flex-col ${
                message.sender._id === currentUser._id ? 'items-end' : 'items-start'
              } max-w-[75%] sm:max-w-xs md:max-w-md lg:max-w-lg`}>
                {message.sender._id !== currentUser._id && (
                  <span className="text-xs font-medium text-gray-600 mb-1 ml-1 hidden sm:block">
                    {message.sender.name}
                  </span>
                )}

                <div
                  className={`rounded-2xl px-3 sm:px-4 py-2 sm:py-3 shadow-sm ${
                    message.sender._id === currentUser._id
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
                  }`}
                  style={{
                    wordWrap: 'break-word',
                    position: 'relative'
                  }}
                >
                  <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>

                  <div className={`flex items-center justify-between mt-2 ${
                    message.sender._id === currentUser._id ? 'flex-row-reverse' : 'flex-row'
                  }`}>
                    <span className={`text-xs ${
                      message.sender._id === currentUser._id ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.createdAt)}
                    </span>

                    {message.sender._id === currentUser._id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-2 hover:bg-blue-700 rounded-full opacity-70 hover:opacity-100"
                          >
                            <MoreVertical className="h-3 w-3 text-blue-100" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleDeleteMessage(message._id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              {message.sender._id === currentUser._id && (
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 ml-2 sm:ml-3 flex-shrink-0">
                  <AvatarImage src={message.sender.avatar} />
                  <AvatarFallback className="text-xs sm:text-sm">
                    {message.sender.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              )}
            </motion.div>
          ))
        )}

        {/* Typing Indicator */}
        {otherUserTyping && (
          <div className="flex justify-start w-full px-1 sm:px-2 mb-3 sm:mb-4">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 flex-shrink-0">
              <AvatarImage src={otherUser.avatar} />
              <AvatarFallback className="text-xs sm:text-sm">
                {otherUser.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="bg-gray-200 rounded-2xl rounded-bl-md px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - Fixed at bottom */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-2 sm:p-4">
        {/* Media Upload Buttons */}
        <div className="flex items-center space-x-1 sm:space-x-2 mb-2 sm:mb-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleImageUpload}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0"
          >
            <Image className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleVoiceRecord}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0"
          >
            <Mic className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleFileUpload}
            className="h-8 w-8 sm:h-10 sm:w-10 p-0"
          >
            <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          onChange={onImageSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileSelect}
          className="hidden"
        />

        {/* Message Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex space-x-1 sm:space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type your message..."
            className="flex-1 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
            autoComplete="off"
          />
          <Button
            type="submit"
            disabled={sendingMessage || !newMessage.trim()}
            className="bg-green-600 hover:bg-green-700 px-3 sm:px-4 h-10 min-w-[40px]"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
