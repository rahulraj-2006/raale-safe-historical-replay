import axios from 'axios';
import {
  DashboardMetrics, EventListResponse, EventDetail,
  DependencyCheckResult, DryRunResult, ReplayResponse,
  AuditLogListResponse, ReplayRule, ExperimentRunResponse,
  HealthStatus, LoginResponse, AuthUser, PayloadValidationResult,
  TestCaseSample
} from '../types';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to request headers if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('raale_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication APIs
export const loginUser = async (username: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/login', { username, password });
  if (res.data.access_token) {
    localStorage.setItem('raale_access_token', res.data.access_token);
  }
  return res.data;
};

export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const res = await api.get<AuthUser>('/auth/me');
  return res.data;
};

export const fetchAvailableUsers = async (): Promise<AuthUser[]> => {
  const res = await api.get<AuthUser[]>('/auth/users');
  return res.data;
};

// Healthcare Payload Validation APIs
export const validatePayloadApi = async (payload: any, payloadType = 'AUTO', eventId?: string): Promise<PayloadValidationResult> => {
  const res = await api.post<PayloadValidationResult>('/payloads/validate', {
    payload,
    payload_type: payloadType,
    event_id: eventId
  });
  return res.data;
};

export const fetchPayloadTestSuite = async (): Promise<TestCaseSample[]> => {
  const res = await api.get<TestCaseSample[]>('/payloads/test-suite');
  return res.data;
};

export const runFullPayloadTestSuite = async (): Promise<any> => {
  const res = await api.post('/payloads/test-suite/run-all');
  return res.data;
};

// General Core APIs
export const fetchHealth = async (): Promise<HealthStatus> => {
  const res = await api.get<HealthStatus>('/health');
  return res.data;
};

export const fetchDashboardMetrics = async (): Promise<DashboardMetrics> => {
  const res = await api.get<DashboardMetrics>('/dashboard');
  return res.data;
};

export const fetchEvents = async (params: {
  page?: number;
  size?: number;
  source_system?: string;
  event_type?: string;
  status?: string;
  search?: string;
}): Promise<EventListResponse> => {
  const res = await api.get<EventListResponse>('/events', { params });
  return res.data;
};

export const fetchEventDetails = async (eventId: string): Promise<EventDetail> => {
  const res = await api.get<EventDetail>(`/events/${eventId}`);
  return res.data;
};

export const checkDependencies = async (eventId: string, actorRole: string): Promise<DependencyCheckResult> => {
  const res = await api.post<DependencyCheckResult>(`/events/${eventId}/dependencies/check`, {
    actor_role: actorRole
  });
  return res.data;
};

export const executeDryRun = async (eventId: string, actorRole: string, transformationVersion = 'v2.0'): Promise<DryRunResult> => {
  const res = await api.post<DryRunResult>(`/events/${eventId}/dry-run`, {
    actor_role: actorRole,
    target_transformation_version: transformationVersion
  });
  return res.data;
};

export const requestReplay = async (eventId: string, actorRole: string, reason: string): Promise<ReplayResponse> => {
  const res = await api.post<ReplayResponse>(`/events/${eventId}/replay/request`, {
    actor_role: actorRole,
    reason
  });
  return res.data;
};

export const approveReplay = async (eventId: string, actorRole: string, reason?: string): Promise<ReplayResponse> => {
  const res = await api.post<ReplayResponse>(`/events/${eventId}/replay/approve`, {
    actor_role: actorRole,
    reason
  });
  return res.data;
};

export const rejectReplay = async (eventId: string, actorRole: string, reason?: string): Promise<ReplayResponse> => {
  const res = await api.post<ReplayResponse>(`/events/${eventId}/replay/reject`, {
    actor_role: actorRole,
    reason
  });
  return res.data;
};

export const executeReplay = async (eventId: string, actorRole: string): Promise<ReplayResponse> => {
  const res = await api.post<ReplayResponse>(`/events/${eventId}/replay/execute`, {
    actor_role: actorRole
  });
  return res.data;
};

export const fetchAuditLogs = async (params?: {
  event_id?: string;
  action?: string;
  status?: string;
  search?: string;
  limit?: number;
}): Promise<AuditLogListResponse> => {
  const res = await api.get<AuditLogListResponse>('/audit-logs', { params });
  return res.data;
};

export const fetchRules = async (): Promise<ReplayRule[]> => {
  const res = await api.get<ReplayRule[]>('/rules');
  return res.data;
};

export const updateRule = async (ruleId: number, isEnabled: boolean): Promise<ReplayRule> => {
  const res = await api.put<ReplayRule>(`/rules/${ruleId}`, {
    is_enabled: isEnabled
  });
  return res.data;
};

export const fetchLatestExperiment = async (): Promise<ExperimentRunResponse> => {
  const res = await api.get<ExperimentRunResponse>('/experiments');
  return res.data;
};

export const runNewExperiment = async (sampleSize = 500): Promise<ExperimentRunResponse> => {
  const res = await api.post<ExperimentRunResponse>(`/experiments/run?sample_size=${sampleSize}`);
  return res.data;
};
