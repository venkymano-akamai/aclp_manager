import { FILTER_CONFIG } from './FilterConfig';

import type { CloudPulseServiceTypeFilters } from './models';
import type { Dashboard, Filter, TimeDuration } from '@linode/api-v4';

export const getRegionProperties = (
  config: CloudPulseServiceTypeFilters,
  handleRegionChange: (region: string | undefined) => void,
  dashboard: Dashboard,
  isServiceAnalyticsIntegration: boolean
) => {
  return {
    componentKey: config.configuration.filterKey,
    filterKey: config.configuration.filterKey,
    handleRegionChange,
    key: config.configuration.filterKey,
    placeholder: config.configuration.placeholder,
    savePreferences: !isServiceAnalyticsIntegration,
    selectedDashboard: dashboard,
  };
};

export const getResourcesProperties = (
  config: CloudPulseServiceTypeFilters,
  handleResourceChange: (resourceId: number[]) => void,
  dashboard: Dashboard,
  isServiceAnalyticsIntegration: boolean,
  dependentFilters: { [key: string]: any }
) => {
  return {
    componentKey: config.configuration.filterKey,
    disabled: checkIfWeNeedToDisableFilterByFilterKey(
      config.configuration.filterKey,
      dependentFilters,
      dashboard
    ),
    filterKey: config.configuration.filterKey,
    handleResourceChange: handleResourceChange,
    key: config.configuration.filterKey,
    placeholder: config.configuration.placeholder,
    resourceType: dashboard.service_type,
    savePreferences: !isServiceAnalyticsIntegration,
    xFilter: buildXFilter(config, dependentFilters),
  };
};

export const getTimeDurationProperties = (
  config: CloudPulseServiceTypeFilters,
  handleTimeRangeChange: (start:number, end:number, timeDuration: TimeDuration, label:string) => void,
  isServiceAnalyticsIntegration: boolean
) => {
  return {
    componentKey: config.configuration.filterKey,
    filterKey: config.configuration.filterKey,
    handleStatsChange: handleTimeRangeChange,
    key: config.configuration.filterKey,
    placeholder: config.configuration.placeholder,
    savePreferences: !isServiceAnalyticsIntegration,
  };
};

export const buildXFilter = (
    config: CloudPulseServiceTypeFilters,
    dependentFilters: {
      [key: string]:
        | TimeDuration
        | number
        | number[]
        | string
        | string[]
        | undefined;
    }
  ) => {
    const filters: Filter[] = [];
  
    if (config.configuration.dependency) {
      for (let i = 0; i < config.configuration.dependency.length; i++) {
        if (dependentFilters[config.configuration.dependency[i]]) {
          const value = dependentFilters[config.configuration.dependency[i]];
          const key = config.configuration.dependency[i];
          if (Array.isArray(value)) {
            const orCondition = value.map((val) => ({ [key]: val }));
            filters.push({ '+or': orCondition });
          } else {
            filters.push({ [key]: value });
          }
        }
      }
    }
  
    return { '+and': [...filters] };
  };

// export const buildXFilter = (
//   config: CloudPulseServiceTypeFilters,
//   dependentFilters: { [key: string]: any }
// ) => {
//   const xFilterObj: any = {};

//   if (config.configuration.dependency) {
//     for (let i = 0; i < config.configuration.dependency.length; i++) {
//       xFilterObj[config.configuration.dependency[i]] =
//         dependentFilters[config.configuration.dependency[i]];
//     }
//   }

//   return xFilterObj;
// };

export const checkIfWeNeedToDisableFilterByFilterKey = (
  filterKey: string,
  dependentFilters: { [key: string]: any },
  dashboard: Dashboard
) => {
  if (dashboard && dashboard.service_type) {
    const serviceTypeConfig = FILTER_CONFIG.get(dashboard.service_type!);
    const filters = serviceTypeConfig?.filters ?? [];

    const filter = filters.find(
      (filter) =>
        filter?.configuration.filterKey === filterKey &&
        filter.configuration.dependency
    );

    if (filter) {
      return filter.configuration.dependency?.some((dependent) => {
        const dependentFilter = dependentFilters[dependent];
        return (
          !dependentFilter ||
          (Array.isArray(dependentFilter) && dependentFilter.length === 0)
        );
      });
    }
  }
  return false;
};
