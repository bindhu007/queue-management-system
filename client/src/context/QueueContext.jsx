import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { apiRequest } from '../utils/api';
import { announcer } from '../components/AudioChime';

const QueueContext = createContext(null);

export function QueueProvider({ children }) {
  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState(null);
  const [currentQueueDetail, setCurrentQueueDetail] = useState(null);
  const [waitingTokens, setWaitingTokens] = useState([]);
  const [inServiceToken, setInServiceToken] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [socketConnected, setSocketConnected] = useState(false);

  // Toast notification helper
  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch list of all queues
  const fetchQueues = useCallback(async () => {
    try {
      const data = await apiRequest('/queues');
      setQueues(data.queues || []);
      // If none selected, default to first active queue
      if (!selectedQueueId && data.queues && data.queues.length > 0) {
        setSelectedQueueId(data.queues[0].id);
      }
    } catch (err) {
      console.error('Error fetching queues:', err);
    }
  }, [selectedQueueId]);

  // Fetch single queue details and waiting tokens
  const fetchQueueDetail = useCallback(async (queueId) => {
    if (!queueId) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/queues/${queueId}`);
      setCurrentQueueDetail(data.queue);
      setInServiceToken(data.inServiceToken);
      setWaitingTokens(data.waitingTokens || []);
      setRecentActivity(data.recentActivity || []);
    } catch (err) {
      console.error('Error fetching queue detail:', err);
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Fetch analytics dashboard
  const fetchAnalytics = useCallback(async (queueId = null) => {
    try {
      const query = queueId && queueId !== 'all' ? `?queue_id=${queueId}` : '';
      const data = await apiRequest(`/analytics/dashboard${query}`);
      setAnalytics(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    }
  }, []);

  // Sync when selectedQueueId changes
  useEffect(() => {
    fetchQueues();
  }, [fetchQueues]);

  useEffect(() => {
    if (selectedQueueId) {
      fetchQueueDetail(selectedQueueId);
    }
  }, [selectedQueueId, fetchQueueDetail]);

  // Socket.io Real-Time Synchronization
  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      setSocketConnected(true);
      console.log('Connected to Q-Flow real-time socket');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
    });

    socket.on('queue_update', (event) => {
      console.log('Received real-time queue event:', event);

      // Trigger audio chime & speech if token was assigned to counter
      if (event.type === 'TOKEN_SERVED' && event.announcement) {
        announcer.announceToken(event.announcement.tokenNumber, event.announcement.counterName);
      }

      // Refresh queues list and active detail
      fetchQueues();
      if (selectedQueueId) {
        fetchQueueDetail(selectedQueueId);
      }
      fetchAnalytics(selectedQueueId);
    });

    return () => {
      socket.disconnect();
    };
  }, [selectedQueueId, fetchQueues, fetchQueueDetail, fetchAnalytics]);

  // Fallback Polling if running on serverless environments (e.g. Vercel)
  useEffect(() => {
    if (socketConnected) return;

    const pollInterval = setInterval(() => {
      fetchQueues();
      if (selectedQueueId) {
        fetchQueueDetail(selectedQueueId);
      }
    }, 4000);

    return () => clearInterval(pollInterval);
  }, [socketConnected, selectedQueueId, fetchQueues, fetchQueueDetail]);

  // Create Queue (Req 1 & 2)
  const createQueue = async (queueData) => {
    try {
      const res = await apiRequest('/queues', {
        method: 'POST',
        body: JSON.stringify(queueData)
      });
      addToast(`Queue "${res.queue.name}" created successfully!`, 'success');
      await fetchQueues();
      setSelectedQueueId(res.queue.id);
      return res.queue;
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  // Add person / token into queue (Req 3)
  const addToken = async (tokenData) => {
    try {
      const res = await apiRequest('/tokens', {
        method: 'POST',
        body: JSON.stringify(tokenData)
      });
      addToast(`Token ${res.token.token_number} issued for ${res.token.customer_name}`, 'success');
      if (tokenData.queue_id === selectedQueueId) {
        await fetchQueueDetail(selectedQueueId);
      }
      await fetchQueues();
      return res.token;
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  // Move token UP (Req 5)
  const moveTokenUp = async (tokenId) => {
    try {
      const res = await apiRequest(`/tokens/${tokenId}/move-up`, { method: 'POST' });
      addToast(res.message, 'info');
      if (selectedQueueId) {
        await fetchQueueDetail(selectedQueueId);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Move token DOWN (Req 5)
  const moveTokenDown = async (tokenId) => {
    try {
      const res = await apiRequest(`/tokens/${tokenId}/move-down`, { method: 'POST' });
      addToast(res.message, 'info');
      if (selectedQueueId) {
        await fetchQueueDetail(selectedQueueId);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Move directly to top (#1)
  const moveTokenTop = async (tokenId) => {
    try {
      const res = await apiRequest(`/tokens/${tokenId}/move-top`, { method: 'POST' });
      addToast(res.message, 'success');
      if (selectedQueueId) {
        await fetchQueueDetail(selectedQueueId);
      }
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Assign token at top of queue for service [1-click] (Req 6)
  const serveTopToken = async (queueId) => {
    const qId = queueId || selectedQueueId;
    if (!qId) return;

    try {
      const res = await apiRequest(`/tokens/serve-top/${qId}`, { method: 'POST' });
      addToast(`Now Serving: ${res.servedToken.token_number} (${res.servedToken.customer_name})`, 'success');
      // Announce right away
      announcer.announceToken(res.servedToken.token_number, res.servedToken.counter_name);
      await fetchQueueDetail(qId);
      await fetchQueues();
      return res.servedToken;
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  // Complete in-service token
  const completeToken = async (tokenId) => {
    try {
      const res = await apiRequest(`/tokens/${tokenId}/complete`, { method: 'POST' });
      addToast(res.message, 'success');
      if (selectedQueueId) {
        await fetchQueueDetail(selectedQueueId);
      }
      await fetchQueues();
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  // Cancel token from queue (Req 7)
  const cancelToken = async (tokenId, reason) => {
    try {
      const res = await apiRequest(`/tokens/${tokenId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      });
      addToast(res.message, 'warning');
      if (selectedQueueId) {
        await fetchQueueDetail(selectedQueueId);
      }
      await fetchQueues();
    } catch (err) {
      addToast(err.message, 'error');
      throw err;
    }
  };

  // Reseed demo data for evaluator
  const reseedDemo = async () => {
    try {
      await apiRequest('/analytics/reseed', { method: 'POST' });
      addToast('Demo database re-seeded with realistic queues and analytics!', 'success');
      await fetchQueues();
      if (selectedQueueId) {
        await fetchQueueDetail(selectedQueueId);
      }
      await fetchAnalytics(selectedQueueId);
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  return (
    <QueueContext.Provider value={{
      queues,
      selectedQueueId,
      setSelectedQueueId,
      currentQueueDetail,
      waitingTokens,
      inServiceToken,
      recentActivity,
      analytics,
      loading,
      toasts,
      socketConnected,
      addToast,
      removeToast,
      fetchQueues,
      fetchQueueDetail,
      fetchAnalytics,
      createQueue,
      addToken,
      moveTokenUp,
      moveTokenDown,
      moveTokenTop,
      serveTopToken,
      completeToken,
      cancelToken,
      reseedDemo
    }}>
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}
