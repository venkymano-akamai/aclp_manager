import {
  CloudViewMetricsRequest,
  Filters,
  MetricDefinitions,
  Widgets,
} from '@linode/api-v4';
import { Paper } from '@mui/material';
import { styled, useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import React from 'react';

import { CircleProgress } from 'src/components/CircleProgress';
import { useCloudViewMetricsQuery } from 'src/queries/cloudview/metrics';
import { useProfile } from 'src/queries/profile';
import { isToday as _isToday } from 'src/utilities/isToday';
import { roundTo } from 'src/utilities/roundTo';
import { getMetrics } from 'src/utilities/statMetrics';

import { FiltersObject } from '../Models/GlobalFilterProperties';
import { CloudViewLineGraph } from './CloudViewLineGraph';
import { ZoomIcon } from './Components/Zoomer';
import { seriesDataFormatter } from './Formatters/CloudViewFormatter';
import { COLOR_MAP } from './Utils/WidgetColorPalettes';
import { useMutatePreferences, usePreferences } from 'src/queries/preferences';
import { AclpWidgetPreferences } from '../Models/UserPreferences';

export interface CloudViewWidgetProperties {
  // we can try renaming this CloudViewWidget
  ariaLabel?: string;
  authToken: string;
  errorLabel?: string; // error label can come from dashboard
  globalFilters?: FiltersObject; // this is dashboard level global filters, its also optional
  // any change in the current widget, call and pass this function and handle in parent component
  handleWidgetChange: (widget: Widgets) => void;
  metricDefinition: MetricDefinitions;

  unit: string; // this should come from dashboard, which maintains map for service types in a separate API call
  useColorIndex?: number;
  widget: Widgets; // this comes from dashboard, has inbuilt metrics, agg_func,group_by,filters,gridsize etc , also helpful in publishing any changes
}

export const CloudViewWidget = (props: CloudViewWidgetProperties) => {

  const aclpWidgetPreferenceRef = React.useRef<AclpWidgetPreferences[]>();
  const { data: preferences, refetch: refetchPreferences } = usePreferences();
  const { mutateAsync: updatePreferences } = useMutatePreferences();

  const { data: profile } = useProfile();

  const timezone = profile?.timezone || 'US/Eastern';

  const [data, setData] = React.useState<Array<any>>([]);

  const [legendRows, setLegendRows] = React.useState<any[]>([]);

  const [error, setError] = React.useState<boolean>(false);

  const [widget, setWidget] = React.useState<Widgets>({ ...props.widget }); // any change in agg_functions, step, group_by, will be published to dashboard component for save

  const theme = useTheme();
  React.useEffect(() => {
    // localStorage.setItem('aclp_config', JSON.stringify(aclpPreference));
    // Todo, make an API call
    if (preferences && preferences.aclpWidgetPreferenceRef) {
      aclpWidgetPreferenceRef.current = JSON.parse(
        JSON.stringify(preferences.aclpWidgetPreferenceRef)
      );
    }
  }, [preferences]);
  const handleAclpPreferenceChange = () => {
    // localStorage.setItem('aclp_config', JSON.stringify(aclpPreference));
    // Todo, make an API call
    if (
      aclpWidgetPreferenceRef.current != undefined &&
      (aclpWidgetPreferenceRef.current.length !=0)
    ) {
      refetchPreferences()
        .then(({ data: response }) => response ?? Promise.reject())
        .then((response) => {
          updatePreferences({
            ...response,
            aclpWidgetPreferenceRef,
          });
        })
        .catch();
    }
  };


  // const getShowToday = () => {
  //   if (props.globalFilters) {
  //     return (
  //       (props.globalFilters?.timeRange.start -
  //         props.globalFilters?.timeRange.end) /
  //         3600 <=
  //       24
  //     );
  //   } else {
  //     // take from widgets itself
  //     return false;
  //   }
  // };

  const getCloudViewMetricsRequest = (): CloudViewMetricsRequest => {
    const request = {} as CloudViewMetricsRequest;
    request.aggregate_function = widget.aggregate_function;
    request.group_by = widget.group_by;
    if (props.globalFilters) {
      request.resource_id = props.globalFilters.resource!;
    } else {
      request.resource_id = widget.resource_id;
    }
    request.metric = widget.metric!;
    request.time_duration = props.globalFilters
      ? props.globalFilters.duration!
      : widget.time_duration;
    request.time_granularity = props.globalFilters
      ? props.globalFilters.step!
      : widget.time_granularity; // todo, move to widgets

    // if (props.globalFilters) {
    //   // this has been kept because for mocking data, we will remove this
    //   request.startTime = props.globalFilters?.timeRange.start;
    //   request.endTime = props.globalFilters?.timeRange.end;
    // }
    return request;
  };

  const tooltipValueFormatter = (value: number, unit: string) =>
    `${roundTo(value)} ${unit}`;

  const getServiceType = () => {
    return props.widget.serviceType
      ? props.widget.serviceType!
      : props.globalFilters
      ? props.globalFilters.serviceType
      : '';
  };

  const getWidgetPrefrences = (currentWidgetPrefs: any, sizest: number) => {
    if (!currentWidgetPrefs) return [];
    console.log("widget prefs", currentWidgetPrefs);
    let tempWidgets = currentWidgetPrefs.filter((obj: any) => obj.label!=widget.label);
    tempWidgets.push({
      label: widget.label,
      size: sizest
    });
    console.log("tempwidgets",tempWidgets);
    return tempWidgets;
  };

  const {
    data: metricsList,
    isLoading,
    status,
  } = useCloudViewMetricsQuery(
    getServiceType()!,
    getCloudViewMetricsRequest(),
    props,
    [widget.aggregate_function, widget.group_by, widget.time_granularity]
  ); // fetch the metrics on any property change

  React.useEffect(() => {
    // refetchPreferences()
    //     .then(({ data: response }) => response ?? Promise.reject())
    //     .then((response) => {
    //       updatePreferences({
    //         ...response,
    //         aclpWidgetPreferenceRef,
    //       });
    //     })
    //     .catch();
    // on any change in the widget object, just publish the changes to parent component using a callback function
    props.handleWidgetChange(widget);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget]);

  /**
   * This will be executed, each time when we receive response from metrics api
   * and does formats the data compatible for the graph
   */
  React.useEffect(() => {
    const dimensions: any[] = [];
    const legendRowsData: any[] = [];

    // for now we will use this guy, but once we decide how to work with coloring, it should be dynamic
    const colors: string[] = COLOR_MAP.get(props.widget.color)!;

    if (status == 'success') {
      let index = 0;

      metricsList.data.result.forEach((graphData) => {
        // todo, move it to utils at a widget level
        if (graphData == undefined || graphData == null) {
          return;
        }
        const color = colors[index];
        const dimension = {
          backgroundColor: color,
          borderColor: color,
          data: seriesDataFormatter(
            graphData.values,
            props.globalFilters?.timeRange.start,
            props.globalFilters?.timeRange.end
          ),
          label: graphData.metric.LINODE_ID
            ? graphData.metric.LINODE_ID
            : props.widget.label + ' (' + props.widget.unit + ')',
        };

        // construct a legend row with the dimension
        const legendRow = {
          data: getMetrics(dimension.data as number[][]),
          format: (value: number) => tooltipValueFormatter(value, widget.unit),
          legendColor: color,
          legendTitle: dimension.label,
        };
        legendRowsData.push(legendRow);
        dimensions.push(dimension);
        index = index + 1;
      });

      // chart dimensions
      setData(dimensions);
      setLegendRows(legendRowsData);
    }

    if (status == 'error') {
      setError(true);
    } else {
      // set error false
      setError(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, metricsList]);

  if (isLoading) {
    return (
      <Grid xs={widget.size}>
        <Paper style={{ height: '98%', width: '100%' }}>
          <div style={{ margin: '1%' }}>
            <CircleProgress />
          </div>
        </Paper>
      </Grid>
    );
  }

  const handleZoomToggle = (zoomInValue: boolean) => {
    setWidget((widget) => {
      return { ...widget, size: zoomInValue ? 12 : 6 };
    });
    aclpWidgetPreferenceRef.current = getWidgetPrefrences(aclpWidgetPreferenceRef.current.current, 
      zoomInValue ? 12 : 6 
    );
    handleAclpPreferenceChange();
  };

  const handleAggregateFunctionChange = (aggregateValue: string) => {
    // todo, add implementation once component is ready
  };

  const handleFilterChange = (widgetFilter: Filters[]) => {
    // todo, add implementation once component is ready
  };

  const handleGroupByChange = (groupby: string) => {
    // todo, add implememtation once component is ready
  };

  const handleGranularityChange = (step: string) => {
    // todo, add implementation once component is ready
  };

  const handleIntervalChange = () => {
    // todo, add implementation
  };

  const getWidgetSize = () => {
    if (preferences?.aclpWidgetPreferenceRef){
      let index = preferences.aclpWidgetPreferenceRef.current.findIndex((obj) => obj.label == widget.label);
      if (index > -1) {
        return preferences.aclpWidgetPreferenceRef.current[index].size;
      }
    }
    return widget.size;
  };

  const StyledZoomIcon = styled(ZoomIcon, {
    label: 'StyledZoomIcon',
  })({
    display: 'inline-block',
    float: 'right',
    marginLeft: '10px',
    marginTop: '10px',
  });

  if (!preferences) {
    return <></>;
  }
  return (
    <Grid xs={getWidgetSize()}>
      <Paper style={{ height: '98%', width: '100%' }}>
        {/* add further components like group by resource, aggregate_function, step here , for sample added zoom icon here*/}
        <div className={widget.metric} style={{ margin: '1%' }}>
          <StyledZoomIcon
            handleZoomToggle={handleZoomToggle}
            zoomIn={getWidgetSize() == 12 ? true : false}
          />
          <CloudViewLineGraph // rename where we have cloudview to cloudpulse
            error={
              error
                ? props.errorLabel && props.errorLabel.length > 0
                  ? props.errorLabel
                  : 'Error while rendering widget'
                : undefined
            }
            showToday={_isToday(
              props.globalFilters?.timeRange.start
                ? props.globalFilters.timeRange.start
                : 0,
              props.globalFilters?.timeRange.end
                ? props.globalFilters.timeRange.end
                : 0
            )}
            ariaLabel={props.ariaLabel ? props.ariaLabel : ''}
            data={data}
            gridSize={getWidgetSize()}
            legendRows={legendRows}
            loading={isLoading}
            nativeLegend={true}
            subtitle={props.unit}
            timezone={timezone}
            title={props.widget.label}
            unit={' ' + props.unit}
          />
        </div>
      </Paper>
    </Grid>
  );
};
