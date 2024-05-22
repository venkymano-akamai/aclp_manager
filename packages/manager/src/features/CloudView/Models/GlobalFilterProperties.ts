import { Dashboard, TimeDuration, TimeGranularity } from '@linode/api-v4';

import { WithStartAndEnd } from 'src/features/Longview/request.types';

import { AclpPreference } from './UserPreferences';

export interface GlobalFilterProperties {
  aclpPreferences?: AclpPreference;
  handleAnyFilterChange(filters: FiltersObject): undefined | void;
  handleDashboardChange(dashboard: Dashboard): undefined | void;
}

export interface FiltersObject {
  duration?: TimeDuration;
  interval: string;
  region: string;
  resource: string[];
  serviceType?: string;
  step?: TimeGranularity;
  timeRange: WithStartAndEnd;
  timeRangeLabel: string;
}
