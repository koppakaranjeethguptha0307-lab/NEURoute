/**
 * Centralized API Client for NEURote GIS & Maps Module
 * Strictly calls "/api/v1/*" endpoints matching backend contracts:
 * - /api/v1/roads (Road Segments GeoJSON FeatureCollection)
 * - /api/v1/incidents (Incident reports & GeoJSON points)
 * - /api/v1/hazards (Regional hazard hotspots)
 * - /api/v1/hubs (Logistics depots)
 * - /api/v1/vehicles (Fleet telemetry)
 * - /api/v1/vehicles/{id}/location (Vehicle telemetry update)
 * - /api/v1/routes/plan (Multi-criteria route planning)
 * - /api/v1/routes/alternate (Alternate rerouting)
 *
 * Implements granular response state classification:
 * - SUCCESS (200 with data)
 * - EMPTY (200 with empty array/collection)
 * - PERMISSION_DENIED (403 Forbidden / FORBIDDEN)
 * - NOT_FOUND (404 Not Found)
 * - SERVER_ERROR (500 / 502 / 503)
 * - NETWORK_ERROR (Connection refused / aborted)
 * - FALLBACK_MOCK (Transparent canonical data with explicit state disclosure)
 */

import {
  mockRoadSegmentsGeoJSON,
  mockIncidents,
  mockHazards,
  mockHubs,
  mockVehicles,
  mockRoutePlanResponse,
} from './mockData';

const BASE_URL = import.meta.env?.VITE_API_BASE_URL || '/api/v1';

/**
 * Robust request executor with granular status mapping and layer-independent fallback
 */
async function executeApiRequest(endpoint, options = {}, fallbackData = null, allowMockFallback = true) {
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
      signal: controller.signal,
      ...options,
    });
    clearTimeout(timeoutId);

    // 1. Permission Denied (HTTP 403 Forbidden)
    if (response.status === 403) {
      let errDetails = 'Permission denied: Insufficient user role or authorization clearance.';
      try {
        const body = await response.json();
        if (body?.error?.message) errDetails = body.error.message;
      } catch (_) {}
      return {
        data: null,
        status: 'PERMISSION_DENIED',
        statusCode: 403,
        isLive: true,
        isFallback: false,
        errorMessage: errDetails,
      };
    }

    // 2. Resource Not Found (HTTP 404)
    if (response.status === 404) {
      const errMsg = `HTTP 404: Endpoint ${endpoint} is not mounted on the backend server.`;
      if (allowMockFallback && fallbackData !== null) {
        return {
          data: fallbackData,
          status: 'FALLBACK_MOCK',
          statusCode: 404,
          isLive: false,
          isFallback: true,
          errorMessage: errMsg,
        };
      }
      return {
        data: null,
        status: 'NOT_FOUND',
        statusCode: 404,
        isLive: false,
        isFallback: false,
        errorMessage: errMsg,
      };
    }

    // 3. Server Errors (HTTP 500, 502, 503)
    if (response.status >= 500) {
      const errMsg = `HTTP ${response.status}: Backend service internal error (${response.statusText}).`;
      if (allowMockFallback && fallbackData !== null) {
        return {
          data: fallbackData,
          status: 'FALLBACK_MOCK',
          statusCode: response.status,
          isLive: false,
          isFallback: true,
          errorMessage: errMsg,
        };
      }
      return {
        data: null,
        status: 'SERVER_ERROR',
        statusCode: response.status,
        isLive: false,
        isFallback: false,
        errorMessage: errMsg,
      };
    }

    // 4. Other Non-OK responses
    if (!response.ok) {
      const errMsg = `HTTP ${response.status}: ${response.statusText}`;
      if (allowMockFallback && fallbackData !== null) {
        return {
          data: fallbackData,
          status: 'FALLBACK_MOCK',
          statusCode: response.status,
          isLive: false,
          isFallback: true,
          errorMessage: errMsg,
        };
      }
      return {
        data: null,
        status: 'SERVER_ERROR',
        statusCode: response.status,
        isLive: false,
        isFallback: false,
        errorMessage: errMsg,
      };
    }

    // 5. Successful 200 OK parsing
    const data = await response.json();

    // Check for empty array or collection
    const isEmpty =
      data === null ||
      data === undefined ||
      (Array.isArray(data) && data.length === 0) ||
      (data.type === 'FeatureCollection' && Array.isArray(data.features) && data.features.length === 0);

    return {
      data,
      status: isEmpty ? 'EMPTY' : 'SUCCESS',
      statusCode: 200,
      isLive: true,
      isFallback: false,
      errorMessage: null,
    };
  } catch (err) {
    const isNetworkAbort = err.name === 'AbortError';
    const errMsg = isNetworkAbort
      ? `Network timeout: Request to ${endpoint} exceeded 3.5s.`
      : `Network error: Failed to connect to ${url} (${err.message}).`;

    if (allowMockFallback && fallbackData !== null) {
      return {
        data: fallbackData,
        status: 'FALLBACK_MOCK',
        statusCode: 0,
        isLive: false,
        isFallback: true,
        errorMessage: errMsg,
      };
    }
    return {
      data: null,
      status: 'NETWORK_ERROR',
      statusCode: 0,
      isLive: false,
      isFallback: false,
      errorMessage: errMsg,
    };
  }
}

export const api = {
  /**
   * Fetch Canonical Road Segments GeoJSON FeatureCollection
   * GET /api/v1/roads
   */
  async getRoadsGeoJSON(allowFallback = true) {
    return executeApiRequest('/roads', { method: 'GET' }, mockRoadSegmentsGeoJSON, allowFallback);
  },

  /**
   * Fetch Active Incidents
   * GET /api/v1/incidents
   */
  async getIncidents(allowFallback = true) {
    return executeApiRequest('/incidents', { method: 'GET' }, mockIncidents, allowFallback);
  },

  /**
   * Report Incident to Server
   * POST /api/v1/incidents
   */
  async reportIncident(incidentData, allowFallback = true) {
    return executeApiRequest(
      '/incidents',
      {
        method: 'POST',
        body: JSON.stringify(incidentData),
      },
      {
        incident_id: Date.now(),
        ...incidentData,
        status: 'REPORTED',
        reported_at: new Date().toISOString(),
      },
      allowFallback
    );
  },

  /**
   * Fetch Regional Hazard Zones
   * GET /api/v1/hazards
   */
  async getHazards(allowFallback = true) {
    return executeApiRequest('/hazards', { method: 'GET' }, mockHazards, allowFallback);
  },

  /**
   * Fetch Logistics Hubs
   * GET /api/v1/hubs
   */
  async getHubs(allowFallback = true) {
    return executeApiRequest('/hubs', { method: 'GET' }, mockHubs, allowFallback);
  },

  /**
   * Fetch Active Vehicles Fleet
   * GET /api/v1/vehicles
   */
  async getVehicles(allowFallback = true) {
    return executeApiRequest('/vehicles', { method: 'GET' }, mockVehicles, allowFallback);
  },

  /**
   * Fetch Specific Vehicle Location Telemetry
   * GET /api/v1/vehicles/{id}/location
   */
  async getVehicleLocation(vehicleId, allowFallback = true) {
    const defaultVehicle = mockVehicles.find((v) => v.id === vehicleId) || mockVehicles[0];
    return executeApiRequest(
      `/vehicles/${vehicleId}/location`,
      { method: 'GET' },
      defaultVehicle,
      allowFallback
    );
  },

  /**
   * Plan Multi-Criteria Route
   * POST /api/v1/routes/plan
   */
  async planRoute(payload, allowFallback = true) {
    return executeApiRequest(
      '/routes/plan',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      mockRoutePlanResponse,
      allowFallback
    );
  },

  /**
   * Get Alternate Bypass Route
   * POST /api/v1/routes/alternate
   */
  async getAlternateRoute(payload, allowFallback = true) {
    return executeApiRequest(
      '/routes/alternate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      mockRoutePlanResponse,
      allowFallback
    );
  },
};

export default api;
