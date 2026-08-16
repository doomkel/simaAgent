import { Spinner } from '@fluentui/react-components';
import { useAppState } from './hooks/useAppState';
import { ErrorBoundary } from "./components/core/ErrorBoundary";
import { AgentChat } from "./components/AgentChat";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./hooks/useAuth";
import { useGoogleSignIn } from "./hooks/useGoogleSignIn";
import { GOOGLE_HOSTED_DOMAIN } from "./config/authConfig";
import type { IAgentMetadata } from "./types/chat";
import "./App.css";

function App() {
  const { auth } = useAppState();
  const { getAccessToken } = useAuth();
  const { buttonContainerRef } = useGoogleSignIn();
  const [agentMetadata, setAgentMetadata] = useState<IAgentMetadata | null>(null);
  const [isLoadingAgent, setIsLoadingAgent] = useState(true);

  // Wrap fetchAgentMetadata in useCallback to make it stable for the effect
  const fetchAgentMetadata = useCallback(async () => {
    if (auth.status !== 'authenticated') return;

    try {
      const token = await getAccessToken();
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      
      const response = await fetch(`${apiUrl}/agent`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAgentMetadata(data);
      
      // Update document title with agent name
      document.title = data.name ? `Sima AI Agent` : 'Sima AI ';
    } catch (error) {
      console.error('Error fetching agent metadata:', error);
      // Fallback data keeps UI functional on error
      setAgentMetadata({
        id: 'fallback-agent',
        object: 'agent',
        createdAt: Date.now() / 1000,
        name: 'Sima AI Agent',
        description: 'Your intelligent conversational partner powered by Azure AI',
        model: 'gpt-4o-mini',
        metadata: { logo: 'Avatar_Default.svg' }
      });
      document.title = 'Sima AI Agent';
    } finally {
      setIsLoadingAgent(false);
    }
  }, [auth.status, getAccessToken]);

  useEffect(() => {
    fetchAgentMetadata();
  }, [fetchAgentMetadata]);

  return (
    <ErrorBoundary>
      {auth.status === 'unauthenticated' ? (
        <div className="app-container" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <p>Sign in with your {GOOGLE_HOSTED_DOMAIN} account to continue</p>
          <div ref={buttonContainerRef} />
        </div>
      ) : auth.status === 'initializing' || isLoadingAgent ? (
        <div className="app-container" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          flexDirection: 'column', 
          gap: '1rem' 
        }}>
          <Spinner size="large" />
          <p style={{ margin: 0 }}>
            {auth.status === 'initializing' ? 'Preparing your session...' : 'Loading agent...'}
          </p>
        </div>
      ) : (
        agentMetadata && (
          <div className="app-container">
            <AgentChat 
              agentId={agentMetadata.id}
              agentName={agentMetadata.name}
              agentDescription={agentMetadata.description || undefined}
              agentLogo={agentMetadata.metadata?.logo}
              starterPrompts={agentMetadata.starterPrompts || undefined}
            />
          </div>
        )
      )}
    </ErrorBoundary>
  );
}

export default App;
