export type UserRole = 'Integration Engineer' | 'Auditor / Operations Manager';

export interface EventBase {
  id: str;
  source_system: string;
  event_type: string;
  event_timestamp: string;
  entity_reference: string;
  payload: Record<string, any>;
  schema_version: string;
  transformation_version: string;
  dependency_ids: string[];
  status: 'ARCHIVED' | 'PENDING_REPLAY' | 'REPLAYED' | 'BLOCKED' | 'FAILED';
  is_malformed: boolean;
  has_missing_dependency: boolean;
  has_transformation_mismatch: boolean;
  has_snapshot_conflict: boolean;
}

export interface EventDetail extends EventBase {
  dependencies_detail: Array<{
    id: number;
    required_event_id: string;
    type: string;
    status: string;
  }>;
  target_snapshot?: {
    state: Record<string, any>;
    hash: string;
  };
  replay_history: Array<{
    id: number;
    status: string;
    requested_by: string;
    approved_by?: string;
    requested_at: string;
    approved_at?: string;
    executed_at?: string;
    error_message?: string;
  }>;
}

export interface EventListResponse {
  items: EventBase[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface DependencyCheckResult {
  event_id: string;
  status: 'PASS' | 'WARNING' | 'BLOCKED';
  checks_passed: number;
  checks_total: number;
  block_reasons: string[];
  warning_reasons: string[];
  details: Record<string, any>;
}

export interface DryRunResult {
  dry_run_id: string;
  event_id: string;
  original_snapshot: Record<string, any>;
  predicted_snapshot: Record<string, any>;
  changed_fields: string[];
  added_fields: string[];
  removed_fields: string[];
  hash_before: string;
  hash_after: string;
  hash_difference: boolean;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  dependency_status: string;
  transformation_version: string;
  executed_at: string;
}

export interface ReplayResponse {
  event_id: string;
  replay_record_id: number;
  status: string;
  message: string;
  target_updated: boolean;
  new_snapshot_hash?: string;
  executed_at?: string;
}

export interface AuditLogItem {
  id: number;
  event_id: string;
  actor_role: string;
  action: string;
  timestamp: string;
  status: string;
  reason?: string;
  transformation_version?: string;
  snapshot_hash?: string;
  dry_run_result?: Record<string, any>;
  replay_result?: Record<string, any>;
}

export interface AuditLogListResponse {
  items: AuditLogItem[];
  total: number;
}

export interface ReplayRule {
  id: number;
  rule_key: string;
  name: string;
  description: string;
  is_enabled: boolean;
  category: string;
}

export interface ExperimentMetrics {
  engine_name: string;
  total_events: number;
  successful_replays: number;
  duplicate_replays: number;
  unsafe_replays: number;
  blocked_events: number;
  dependency_failures: number;
  snapshot_conflicts: number;
  transformation_errors: number;
  total_processing_time_ms: number;
  avg_processing_time_ms: number;
  error_rate_pct: number;
}

export interface ExperimentRunResponse {
  experiment_id: string;
  timestamp: string;
  baseline: ExperimentMetrics;
  safe_replay: ExperimentMetrics;
  summary: string;
}

export interface DashboardMetrics {
  total_events: number;
  eligible_events: number;
  blocked_events: number;
  already_replayed: number;
  dry_runs_executed: number;
  successful_replays: number;
  failed_replays: number;
  duplicates_prevented: number;
  events_by_source: Record<string, number>;
  replay_status_counts: Record<string, number>;
  failure_reason_counts: Record<string, number>;
  avg_processing_time_ms: number;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  database: string;
  synthetic_event_count: number;
  timestamp: string;
}
