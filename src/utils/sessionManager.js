// src/utils/sessionManager.js
import api from '../api';

class SessionManager {
  constructor() {
    this.useCookies = true;
    this.manualSessionId = localStorage.getItem('manual_session_id');
    this.sessionCheckInProgress = false;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    console.log('[Session] Initializing session manager...');
    
    try {
      // Try to check session with cookie first
      const response = await api.get('/api/cart/session/check/');
      const sessionId = response.data.session_id;
      
      if (sessionId && response.headers['x-session-id']) {
        console.log('[Session] Cookie-based session working ✅');
        this.useCookies = true;
        this.manualSessionId = sessionId;
        localStorage.setItem('manual_session_id', sessionId);
      } else if (sessionId) {
        console.log('[Session] Session exists but cookie not returned, using manual fallback');
        this.useCookies = false;
        this.manualSessionId = sessionId;
        localStorage.setItem('manual_session_id', sessionId);
      } else {
        // No session exists, create one
        console.log('[Session] No session found, creating new session');
        await this.forceSessionInit();
      }
    } catch (error) {
      console.error('[Session] Session check failed:', error);
      // Fallback to manual session
      this.useCookies = false;
      await this.forceSessionInit();
    }
    
    this.initialized = true;
    console.log('[Session] Session manager initialized. Using cookies:', this.useCookies);
  }

  async forceSessionInit() {
    try {
      const response = await api.post('/api/cart/session/init/');
      this.manualSessionId = response.data.session_id;
      localStorage.setItem('manual_session_id', this.manualSessionId);
      console.log('[Session] Force initialized session:', this.manualSessionId.substring(0, 8) + '...');
      return response.data;
    } catch (error) {
      console.error('[Session] Failed to force session init:', error);
      throw error;
    }
  }

  async ensureSession() {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // If cookies are working, no need for manual header
    if (this.useCookies) {
      return null;
    }
    
    // Manual fallback - ensure we have a session ID
    if (!this.manualSessionId) {
      await this.forceSessionInit();
    }
    
    return this.manualSessionId;
  }

  getSessionHeader() {
    if (!this.useCookies && this.manualSessionId) {
      return { 'X-Session-Id': this.manualSessionId };
    }
    return {};
  }

  async syncSession() {
    try {
      const response = await api.get('/api/cart/session/check/');
      const newSessionId = response.data.session_id;
      
      if (newSessionId && newSessionId !== this.manualSessionId) {
        this.manualSessionId = newSessionId;
        localStorage.setItem('manual_session_id', newSessionId);
        console.log('[Session] Session synced:', newSessionId.substring(0, 8) + '...');
      }
      
      return response.data;
    } catch (error) {
      console.error('[Session] Sync failed:', error);
      return null;
    }
  }
}

export const sessionManager = new SessionManager();