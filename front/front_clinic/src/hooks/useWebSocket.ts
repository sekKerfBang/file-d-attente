// useWebSocket.ts
import { useEffect, useRef, useCallback, useState } from 'react'

interface UseWebSocketOptions {
  onMessage?: (data: any) => void
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
}

export function useWebSocket(
  url: string, 
  options: UseWebSocketOptions = {}
) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10
  } = options

  const ws = useRef<WebSocket | null>(null)
  const reconnectAttempts = useRef(0)
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>()
  const isManualClose = useRef(false)
  const [isConnected, setIsConnected] = useState(false)

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current)
      reconnectTimer.current = undefined
    }
  }, [])

  const connect = useCallback(() => {
    // Évite les connexions multiples
    if (ws.current?.readyState === WebSocket.CONNECTING) {
      console.log('Already connecting...')
      return
    }
    if (ws.current?.readyState === WebSocket.OPEN) {
      console.log('Already connected')
      return
    }

    console.log(`[WS] Connecting to ${url} (attempt ${reconnectAttempts.current + 1})`)
    isManualClose.current = false

    try {
      const socket = new WebSocket(url)

      socket.onopen = () => {
        console.log('[WS] Connected')
        reconnectAttempts.current = 0
        setIsConnected(true)
        onConnect?.()
      }

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          onMessage?.(data)
        } catch (e) {
          console.error('[WS] Failed to parse message:', e)
        }
      }

      socket.onerror = (error) => {
        console.error('[WS] Error:', error)
      }

      socket.onclose = (event) => {
        console.log(`[WS] Closed: ${event.code} - ${event.reason || 'No reason'}`)
        setIsConnected(false)
        onDisconnect?.()
        ws.current = null

        // Reconnexion auto si pas fermé manuellement
        if (!isManualClose.current && event.code !== 1000) {
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++
            console.log(`[WS] Reconnecting in ${reconnectInterval}ms...`)
            reconnectTimer.current = setTimeout(connect, reconnectInterval)
          } else {
            console.error('[WS] Max reconnection attempts reached')
          }
        } else if (event.code === 1000) {
          // Code 1000 = fermeture "propre", on retente quand même après un délai plus long
          console.log('[WS] Clean close, will retry...')
          reconnectTimer.current = setTimeout(connect, reconnectInterval * 2)
        }
      }

      ws.current = socket
    } catch (error) {
      console.error('[WS] Failed to create connection:', error)
    }
  }, [url, onMessage, onConnect, onDisconnect, reconnectInterval, maxReconnectAttempts])

  const disconnect = useCallback((code = 1000, reason = 'Manual close') => {
    console.log('[WS] Manual disconnect')
    isManualClose.current = true
    clearReconnectTimer()
    
    if (ws.current) {
      ws.current.close(code, reason)
      ws.current = null
    }
    setIsConnected(false)
  }, [clearReconnectTimer])

  const send = useCallback((data: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(data))
      return true
    }
    console.warn('[WS] Not connected, cannot send')
    return false
  }, [])

  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
      clearReconnectTimer()
    }
  }, [connect, disconnect, clearReconnectTimer])

  return { send, disconnect, connect, isConnected }
}




// import { useEffect, useRef, useState, useCallback } from 'react';

// interface UseWebSocketOptions {
//   onMessage?: (data: unknown) => void;
//   onConnect?: () => void;
//   onDisconnect?: () => void;
// }

// export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const ws = useRef<WebSocket | null>(null);
//   const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
//   const pingInterval = useRef<ReturnType<typeof setInterval> | null>(null);
//   const reconnectAttempts = useRef(0);
//   const MAX_RECONNECT_ATTEMPTS = 5;

//   const connect = useCallback(() => {
//     try {
//       if (ws.current) {
//         ws.current.close();
//       }

//       // Use relative path for proxy (e.g., '/ws/queue/') -> Vite proxies to backend
//       const wsUrl = url.startsWith('/') 
//         ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}${url}`
//         : url;
      
//       console.log('Connecting to WebSocket:', wsUrl);
      
//       ws.current = new WebSocket(wsUrl);

//       ws.current.onopen = () => {
//         console.log('WebSocket connected');
//         setIsConnected(true);
//         setError(null);
//         reconnectAttempts.current = 0;
//         options.onConnect?.();

//         // Start ping to keep alive
//         pingInterval.current = setInterval(() => {
//           if (ws.current?.readyState === WebSocket.OPEN) {
//             ws.current.send(JSON.stringify({ type: 'ping' })); // Assume server handles ping
//           }
//         }, 30000);
//       };

//       ws.current.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data);
//           options.onMessage?.(data);
//         } catch (err) {
//           console.error('Error parsing WebSocket message:', err);
//         }
//       };

//       ws.current.onclose = (event) => {
//         console.log('WebSocket closed:', event.code, event.reason || 'No reason');
//         setIsConnected(false);
//         options.onDisconnect?.();
//         if (pingInterval.current) clearInterval(pingInterval.current);

//         if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS && event.code !== 1000) { // Ignore normal close
//           const delay = Math.min(1000 * (2 ** reconnectAttempts.current), 30000);
//           console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`);
//           reconnectTimeout.current = setTimeout(() => {
//             reconnectAttempts.current++;
//             connect();
//           }, delay);
//         } else {
//           setError('Max reconnection attempts reached or normal closure');
//         }
//       };

//       ws.current.onerror = (event) => {
//         console.error('WebSocket error:', event);
//         setError('WebSocket connection error');
//       };
//     } catch (err) {
//       console.error('Error creating WebSocket:', err);
//       setError('Failed to create WebSocket connection');
//     }
//   }, [url, options]);

//   const disconnect = useCallback(() => {
//     if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
//     if (pingInterval.current) clearInterval(pingInterval.current);
//     reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS;
//     ws.current?.close(1000, 'Manual close');
//   }, []);

//   const send = useCallback((data: unknown) => {
//     if (ws.current?.readyState === WebSocket.OPEN) {
//       ws.current.send(JSON.stringify(data));
//     } else {
//       console.warn('WebSocket not connected, message not sent');
//     }
//   }, []);

//   useEffect(() => {
//     connect();
//     return () => disconnect();
//   }, [url]);

//   return { isConnected, error, send, disconnect };
// };




// import { useEffect, useRef, useState, useCallback } from 'react'

// interface UseWebSocketOptions {
//   onMessage?: (data: unknown) => void
//   onConnect?: () => void
//   onDisconnect?: () => void
// }

// export const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
//   const [isConnected, setIsConnected] = useState(false)
//   const [error, setError] = useState<string | null>(null)
//   const ws = useRef<WebSocket | null>(null)
//   const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
//   const reconnectAttempts = useRef(0)
//   const MAX_RECONNECT_ATTEMPTS = 5

//   const connect = useCallback(() => {
//     try {
//       // Nettoyer l'ancienne connexion
//       if (ws.current) {
//         ws.current.close()
//       }

//       // Utiliser le proxy Vite en dev, URL directe en prod
//       const wsUrl = url.startsWith('ws') ? url : `ws://${window.location.host}/ws`
      
//       console.log('Connecting to WebSocket:', wsUrl)
      
//       ws.current = new WebSocket(wsUrl)

//       ws.current.onopen = () => {
//         console.log('WebSocket connected')
//         setIsConnected(true)
//         setError(null)
//         reconnectAttempts.current = 0
//         options.onConnect?.()
//       }

//       ws.current.onmessage = (event) => {
//         try {
//           const data = JSON.parse(event.data)
//           options.onMessage?.(data)
//         } catch (err) {
//           console.error('Error parsing WebSocket message:', err)
//         }
//       }

//       ws.current.onclose = (event) => {
//         console.log('WebSocket closed:', event.code, event.reason)
//         setIsConnected(false)
//         options.onDisconnect?.()
        
//         // Reconnexion automatique avec backoff
//         if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
//           const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 30000)
//           console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current + 1})`)
          
//           reconnectTimeout.current = setTimeout(() => {
//             reconnectAttempts.current++
//             connect()
//           }, delay)
//         } else {
//           setError('Max reconnection attempts reached')
//         }
//       }

//       ws.current.onerror = (err) => {
//         console.error('WebSocket error:', err)
//         setError('WebSocket connection error')
//         // Ne pas fermer ici, laisser onclose gérer la reconnexion
//       }
//     } catch (err) {
//       console.error('Error creating WebSocket:', err)
//       setError('Failed to create WebSocket connection')
//     }
//   }, [url, options])

//   const disconnect = useCallback(() => {
//     if (reconnectTimeout.current) {
//       clearTimeout(reconnectTimeout.current)
//       reconnectTimeout.current = null
//     }
//     reconnectAttempts.current = MAX_RECONNECT_ATTEMPTS // Empêcher reconnexion
//     ws.current?.close()
//   }, [])

//   const send = useCallback((data: unknown) => {
//     if (ws.current?.readyState === WebSocket.OPEN) {
//       ws.current.send(JSON.stringify(data))
//     } else {
//       console.warn('WebSocket not connected, message not sent')
//     }
//   }, [])

//   useEffect(() => {
//     connect()
//     return () => disconnect()
//   }, [connect, disconnect])

//   return { isConnected, error, send, disconnect }
// }

