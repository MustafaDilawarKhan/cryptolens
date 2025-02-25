import { create } from 'zustand';
import { APP_BASE_PATH } from 'app';

type WebSocketMessage = {
  type: string;
  data: any;
};

type WebSocketStore = {
  connected: boolean;
  connecting: boolean;
  messages: WebSocketMessage[];
  socket: WebSocket | null;
  connect: () => void;
  disconnect: () => void;
  subscribe: (token: string) => void;
  unsubscribe: (token: string) => void;
  addMessage: (message: WebSocketMessage) => void;
};

const WS_URL = APP_BASE_PATH.replace('http', 'ws') + '/api/ws';

export const useWebSocket = create<WebSocketStore>((set, get) => ({
  connected: false,
  connecting: false,
  messages: [],
  socket: null,

  connect: () => {
    if (get().socket || get().connecting) return;

    set({ connecting: true });
    const socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log('WebSocket connected');
      set({ connected: true, connecting: false, socket });
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      set({ connected: false, connecting: false, socket: null });
      // Try to reconnect after 5 seconds
      setTimeout(() => get().connect(), 5000);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      socket.close();
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        get().addMessage(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.close();
      set({ socket: null, connected: false });
    }
  },

  subscribe: (token: string) => {
    const { socket, connected } = get();
    if (socket && connected) {
      socket.send(JSON.stringify({ type: 'subscribe', token }));
    }
  },

  unsubscribe: (token: string) => {
    const { socket, connected } = get();
    if (socket && connected) {
      socket.send(JSON.stringify({ type: 'unsubscribe', token }));
    }
  },

  addMessage: (message: WebSocketMessage) => {
    set((state) => ({
      messages: [...state.messages.slice(-99), message] // Keep last 100 messages
    }));
  }
}));
