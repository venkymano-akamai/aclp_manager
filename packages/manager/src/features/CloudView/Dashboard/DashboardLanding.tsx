import { Dashboard } from '@linode/api-v4';
import { Paper } from '@mui/material';
import * as React from 'react';

import { FiltersObject } from '../Models/GlobalFilterProperties';
import {
  AclpConfig,
  AclpPreference,
  AclpWidgetPreferences,
} from '../Models/UserPreferences';
import { GlobalFilters } from '../Overview/GlobalFilters';
import { CloudPulseDashboard, DashboardProperties } from './Dashboard';
import { useMutatePreferences, usePreferences } from 'src/queries/preferences';

export const DashBoardLanding = () => {
  const [dashboardProp, setDashboardProp] = React.useState<DashboardProperties>(
    {} as DashboardProperties
  );

  const { data: preferences, refetch: refetchPreferences } = usePreferences();
  const { mutateAsync: updatePreferences } = useMutatePreferences();
  const [aclpPreference, setAclpPreference] = React.useState<AclpPreference>(
    preferences && preferences.aclpPreference
      ? JSON.parse(JSON.stringify(preferences.aclpPreference))
      : undefined!
  );

  const updatedDashboard = React.useRef<Dashboard>();

  React.useEffect(() => {
    // localStorage.setItem('aclp_config', JSON.stringify(aclpPreference));
    // Todo, make an API call
    if (
      aclpPreference != undefined &&
      JSON.stringify(aclpPreference.aclp_config) != '{}'
    ) {
      refetchPreferences()
        .then(({ data: response }) => response ?? Promise.reject())
        .then((response) => {
          updatePreferences({
            ...response,
            aclpPreference: aclpPreference,
          });
        })
        .catch();
    }
  }, [aclpPreference]);

  const handleGlobalFilterChange = (globalFilter: FiltersObject) => {
    // set as dashboard filter
    setDashboardProp({
      ...dashboardProp,
      dashbaord: updatedDashboard.current!,
      dashboardFilters: globalFilter,
    });

    // set updated preferences
    setAclpPreference({ ...constructDashboardPreference(globalFilter) });
  };

  const handleDashboardChange = (dashboard: Dashboard) => {
    setDashboardProp({ ...dashboardProp, dashbaord: dashboard });
    updatedDashboard.current = { ...dashboard };
    if (dashboard) {
    const aclpPref = { ...aclpPreference };
    aclpPref.aclp_config.dashboard_id = dashboard.id;
    setAclpPreference({ ...aclpPref });}
  };

  const constructDashboardPreference = (globalFilter: FiltersObject) => {
    let aclpPreferencObj: AclpPreference = {} as AclpPreference;
    let aclpConfig: AclpConfig = {} as AclpConfig;

    // copy initial set of properties
    if (aclpPreference) {
      aclpPreferencObj = { ...aclpPreference };
      aclpConfig = { ...aclpPreference.aclp_config };
    }

    aclpConfig.aggregation_interval = globalFilter.interval;
    aclpConfig.time_duration = globalFilter.timeRangeLabel; // todo, check this
    aclpConfig.region = globalFilter.region;
    aclpConfig.resources = globalFilter.resource;
    aclpPreferencObj.aclp_config = aclpConfig;

    return aclpPreferencObj;
  };

  const constructWidgetsPreference = (dashboardObj: Dashboard) => {
    const currentWidgets = dashboardObj?.widgets;
    const widgets: AclpWidgetPreferences[] = [];

    if (currentWidgets) {
      currentWidgets.forEach((widget) => {
        widgets.push({ label: widget.label, size: widget.size });
      });
    }

    return widgets;
  };

  const saveOrEditDashboard = (dashboard: Dashboard) => {
    // todo, implement save option
  };

  const deleteDashboard = (dashboardId: number) => {
    // todo, implement delete option
  };

  const markDashboardAsFavorite = () => {
    // todo, implement mark dashboard as favorite
  };

  const resetView = () => {
    // todo, implement the reset view function
  };

  const dashbaordChange = (dashboardObj: Dashboard) => {
    // todo, whenever a change in dashboard happens
    updatedDashboard.current = { ...dashboardObj };

    if (aclpPreference) {
      const newCopyPref = { ...aclpPreference };
      let newWidgets = { ...newCopyPref.aclp_config.widgets };
      newWidgets = [...constructWidgetsPreference({ ...dashboardObj })];
      newCopyPref.aclp_config.widgets = [...newWidgets];
      // setAclpPreference({...newCopyPref});
    } else {
      const newPreference =
        localStorage.getItem('aclp_config') != null &&
        localStorage.getItem('aclp_config')
          ? JSON.parse(localStorage.getItem('aclp_config')!)
          : ({} as AclpPreference);
      newPreference.aclp_config.widgets = constructWidgetsPreference({
        ...dashboardObj,
      });
      // setAclpPreference(newPreference);
    }
  };
  if (!preferences) {
    return <></>;
  }
  return (
    <>
      <Paper>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '100%' }}>
            <GlobalFilters
              handleAnyFilterChange={(filters: FiltersObject) =>
                handleGlobalFilterChange(filters)
              }
              handleDashboardChange={(dashboardObj: Dashboard) =>
                handleDashboardChange(dashboardObj)
              }
              aclpPreferences={aclpPreference ? aclpPreference : undefined}
            ></GlobalFilters>
          </div>
        </div>
      </Paper>
      <CloudPulseDashboard
        {...dashboardProp}
        onDashboardChange={dashbaordChange}
      />
    </>
  );
};
