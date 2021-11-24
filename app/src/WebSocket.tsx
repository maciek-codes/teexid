import React, { createContext } from 'react'
import { useDispatch } from 'react-redux';

interface WebSocketContextInterface {
    socket: WebSocket;
    sendMessage: (a: string) => void;
}

const WebSocketContext = createContext<WebSocketContextInterface | null>(null)

const WS_URL = "ws://localhost:8080/echo";

export { WebSocketContext }

type Props = {
    children: React.ReactNode
}

export default ({ children }: Props) => {
    
    let socket: WebSocket | null = null
    let ws = null;
    const dispatch = useDispatch();

    const sendMessage = (message: string) => {
        const payload = {
            data: message
        }
        socket?.send(JSON.stringify(payload));
        console.log(payload);
    }
    
    if (!socket) {
      socket = new WebSocket(WS_URL);
      socket.onmessage = (msg: MessageEvent<any>) => {
            const payload = JSON.parse(msg.data);
            console.log(payload);
      };

      socket.onopen = (msg: Event) => {
          sendMessage("hello");
      };

      socket.onerror = (msg: Event) => {
          console.log(msg);
      }
    
      ws = {
          socket: socket,
          sendMessage
      }
    }

    return (
        <WebSocketContext.Provider value={ws}>
            {children}
        </WebSocketContext.Provider>
    )
};