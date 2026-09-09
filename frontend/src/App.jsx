import React, { useState } from 'react';
import {
  Map,
  ShieldAlert,
  ClipboardEdit,
  Truck,
  BrainCircuit,
  Radio,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { GISMapPage } from './pages/GISMapPage';

// The 5 Canonical NEURote Portals (Rule 3)
const PORTALS = [
  { id: 'admin', name: 'Admin Console', icon: ShieldAlert, activeForRole: false },
  { id: 'gis', name: 'GIS Monitoring', icon: Map, activeForRole: true },
  { id: 'field', name: 'Field Reporting', icon: ClipboardEdit, activeForRole: false },
  { id: 'tracking', name: 'Vehicle Tracking', icon: Truck, activeForRole: false },
  { id: 'intelligence', name: 'AI Route Intelligence', icon: BrainCircuit, activeForRole: false },
];

export const App = () => {
  const [activePortal, setActivePortal] = useState('gis');

  return (
    <div className="app-container">
      {/* 1. Header Navigation Bar */}
      <header className="top-nav">
        {/* Brand */}
        <div className="brand-badge">
          <div className="brand-logo">
            <Map size={18} />
          </div>
          <div>
            <div className="brand-title">NEURote</div>
          </div>
          <div className="brand-tag">SIH-26002</div>
          <div className="brand-tag" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', borderColor: 'rgba(52, 211, 153, 0.3)' }}>
            GIS & Maps
          </div>
          <div className="brand-tag" style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#38bdf8', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
            🇮🇳 Northeast India (NER)
          </div>
        </div>

        {/* The 5 Canonical Portals Navigation */}
        <nav className="portal-nav" aria-label="Portal Navigation">
          {PORTALS.map((portal) => {
            const Icon = portal.icon;
            const isActive = activePortal === portal.id;
            return (
              <button
                key={portal.id}
                className={`portal-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActivePortal(portal.id)}
                title={portal.activeForRole ? 'Active Role Portal' : 'Managed by Teammate'}
              >
                <Icon size={15} />
                <span>{portal.name}</span>
                {portal.activeForRole ? (
                  <span className="portal-tag-badge" style={{ background: '#0284c7', color: '#fff' }}>
                    Active
                  </span>
                ) : (
                  <span className="portal-tag-badge">Module</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* System & Telemetry Status */}
        <div className="system-status">
          <div className="status-indicator">
            <span className="status-dot" />
            <span style={{ fontWeight: 600, color: '#e2e8f0' }}>PostGIS / OSM Ready</span>
          </div>
          <div className="status-indicator" style={{ borderLeft: '1px solid #334155', paddingLeft: '12px' }}>
            <Radio size={14} color="#38bdf8" />
            <span>8 NER States Monitored</span>
          </div>
        </div>
      </header>

      {/* 2. Main Portal Content */}
      <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {activePortal === 'gis' && <GISMapPage />}

        {activePortal !== 'gis' && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'radial-gradient(circle at center, #0f172a 0%, #020617 100%)',
              color: '#94a3b8',
              padding: '24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(6, 182, 212, 0.1)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                marginBottom: '16px',
              }}
            >
              {activePortal === 'admin' && <ShieldAlert size={32} />}
              {activePortal === 'field' && <ClipboardEdit size={32} />}
              {activePortal === 'tracking' && <Truck size={32} />}
              {activePortal === 'intelligence' && <BrainCircuit size={32} />}
            </div>
            <h2 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              {PORTALS.find((p) => p.id === activePortal)?.name}
            </h2>
            <p style={{ maxWidth: '480px', lineHeight: 1.5, fontSize: '0.9rem', marginBottom: '20px' }}>
              This portal is maintained on dedicated feature branches by respective team members.
              The GIS & Maps module is fully integrated and active under <strong>GIS Monitoring</strong>.
            </p>
            <button
              className="region-btn active"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
              onClick={() => setActivePortal('gis')}
            >
              Return to GIS Monitoring Map <ChevronRight size={14} style={{ display: 'inline', verticalAlign: 'middle' }} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
