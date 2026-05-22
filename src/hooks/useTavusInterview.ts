import { useState, useCallback, useRef } from 'react';

export interface TavusMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseTavusInterviewProps {
  personaId?: string;
}

export function useTavusInterview({ personaId }: UseTavusInterviewProps = {}) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<TavusMessage[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const messagesRef = useRef<TavusMessage[]>([]);

  const initializeConversation = useCallback(
    async (initialMessage: string = '') => {
      if (!personaId) {
        setError('No persona ID provided');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const messagesToSend: TavusMessage[] = [];
        if (initialMessage) {
          messagesToSend.push({
            role: 'user',
            content: initialMessage,
          });
        }

        const response = await fetch('/api/tavus/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personaId,
            messages: messagesToSend,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize conversation');
        }

        const data = await response.json();
        setConversationId(data.conversationId);

        if (data.reply) {
          const aiMessage: TavusMessage = {
            role: 'assistant',
            content: data.reply,
          };
          setMessages([...messagesToSend, aiMessage]);
          messagesRef.current = [...messagesToSend, aiMessage];
        } else {
          setMessages(messagesToSend);
          messagesRef.current = messagesToSend;
        }

        if (data.video_url) {
          setVideoUrl(data.video_url);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error initializing conversation:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [personaId]
  );

  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (!conversationId || !personaId) {
        setError('Conversation not initialized');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const updatedMessages: TavusMessage[] = [
          ...messagesRef.current,
          {
            role: 'user',
            content: userMessage,
          },
        ];

        const response = await fetch('/api/tavus/conversation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personaId,
            messages: updatedMessages,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send message');
        }

        const data = await response.json();

        if (data.reply) {
          const aiMessage: TavusMessage = {
            role: 'assistant',
            content: data.reply,
          };
          const newMessages = [...updatedMessages, aiMessage];
          setMessages(newMessages);
          messagesRef.current = newMessages;
        }

        if (data.video_url) {
          setVideoUrl(data.video_url);
        }

        return data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error sending message:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [conversationId, personaId]
  );

  const reset = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setVideoUrl(null);
    setError(null);
    messagesRef.current = [];
  }, []);

  return {
    conversationId,
    messages,
    isLoading,
    error,
    videoUrl,
    initializeConversation,
    sendMessage,
    reset,
  };
}
