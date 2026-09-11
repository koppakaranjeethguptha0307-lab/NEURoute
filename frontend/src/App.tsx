import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AuthProvider } from './contexts/AuthContext';
import { EmergencyProvider } from './contexts/EmergencyContext';

export function App() {
  return (
    <AuthProvider>
      <EmergencyProvider>
        {React.createElement(RouterProvider as React.ComponentType<{ router: typeof router; future?: { v7_startTransition: boolean } }>, {
          router,
          future: { v7_startTransition: true },
        })}
      </EmergencyProvider>
    </AuthProvider>
  );
}

export default App;
