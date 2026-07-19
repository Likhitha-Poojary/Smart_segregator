import { useEffect, useRef, useState } from 'react';

export function useWebSocket(url, onMessage) {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const onMessageRef = useRef(onMessage);

  // Keep callback reference updated to avoid re-triggering the effect
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    let isMounted = true;

    function connect() {
      if (!isMounted) return;
      
      console.log(`Connecting to WebSocket: ${url}`);
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (isMounted) {
          setConnected(true);
          console.log('WebSocket connected successfully.');
        }
      };

      ws.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          onMessageRef.current(data);
        } catch (e) {
          console.error('Error parsing WebSocket data:', e);
        }
      };

      ws.onclose = () => {
        if (isMounted) {
          setConnected(false);
          console.log('WebSocket connection closed. Retrying in 3 seconds...');
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket encountered an error:', error);
        ws.close();
      };
    }

    connect();

    return () => {
      isMounted = false;
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [url]);

  return connected;
}
