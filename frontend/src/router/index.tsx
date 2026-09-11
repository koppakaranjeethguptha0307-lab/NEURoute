import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/layouts/AppLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { FieldDashboardPage } from '@/pages/FieldDashboardPage';
import { DriverDashboardPage } from '@/pages/DriverDashboardPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { GisMapPage } from '@/pages/GisMapPage';
import { IncidentsPage } from '@/pages/IncidentsPage';
import { RouteIntelligencePage } from '@/pages/RouteIntelligencePage';
import { LogisticsPage } from '@/pages/LogisticsPage';
import { AlertsPage } from '@/pages/AlertsPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { AccessRestrictedPage } from '@/pages/AccessRestrictedPage';

export const router = createBrowserRouter(
  [
    // Public Auth routes
    {
      element: <AuthLayout />,
      children: [
        {
          path: '/login',
          element: <LoginPage />,
        },
      ],
    },
    // Protected main app routes
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="/dashboard" replace />,
        },
        {
          path: 'dashboard',
          element: <DashboardPage />,
        },
        {
          path: 'field-dashboard',
          element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'FIELD_OFFICER']}>
              <FieldDashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'driver-dashboard',
          element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'DRIVER']}>
              <DriverDashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'user-management',
          element: (
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UserManagementPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'gis-map',
          element: <GisMapPage />,
        },
        {
          path: 'incidents',
          element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'FIELD_OFFICER', 'LOGISTICS_PLANNER']}>
              <IncidentsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'routes',
          element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_PLANNER', 'DRIVER']}>
              <RouteIntelligencePage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'logistics',
          element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_PLANNER', 'DRIVER']}>
              <LogisticsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'alerts',
          element: <AlertsPage />,
        },
        {
          path: 'analytics',
          element: (
            <ProtectedRoute allowedRoles={['ADMIN', 'LOGISTICS_PLANNER']}>
              <AnalyticsPage />
            </ProtectedRoute>
          ),
        },
        {
          path: 'unauthorized',
          element: <AccessRestrictedPage />,
        },
        {
          path: '*',
          element: <NotFoundPage />,
        },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true,
    },
  }
);
