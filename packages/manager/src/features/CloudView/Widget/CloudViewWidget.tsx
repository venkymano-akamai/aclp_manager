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
import { useFlags } from 'src/hooks/useFlags';
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

export interface CloudViewWidgetProperties {
  // we can try renaming this CloudViewWidget
  ariaLabel?: string;
  authToken: string;
  errorLabel?: string; // error label can come from dashboard
  globalFilters?: FiltersObject; // this is dashboard level global filters, its also optional
  // any change in the current widget, call and pass this function and handle in parent component
  handleWidgetChange: (widget: Widgets) => void;
  instances: {
    key: string;
    value: string;
  }[];
  metricDefinition: MetricDefinitions;

  unit: string; // this should come from dashboard, which maintains map for service types in a separate API call
  useColorIndex?: number;
  widget: Widgets; // this comes from dashboard, has inbuilt metrics, agg_func,group_by,filters,gridsize etc , also helpful in publishing any changes
}

export const CloudViewWidget = (props: CloudViewWidgetProperties) => {
  const { data: profile } = useProfile();

  const timezone = profile?.timezone || 'US/Eastern';

  const [data, setData] = React.useState<Array<any>>([]);

  const [legendRows, setLegendRows] = React.useState<any[]>([]);

  const [error, setError] = React.useState<boolean>(false);

  const [widget, setWidget] = React.useState<Widgets>({ ...props.widget }); // any change in agg_functions, step, group_by, will be published to dashboard component for save

  const theme = useTheme();

  const flags = useFlags();

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

  const mapInstanceIdToName = (id: string) => {
    if (!props.instances || props.instances.length == 0) {
      return id;
    }
    const results = props.instances.filter(
      (instanceObj) => instanceObj.key == id
    );

    if (results.length > 0) {
      return results[0].value;
    }

    return id;
  };

  const getLabelName = (metric: any, serviceType: string) => {
    flags.cloudPulseResourceTypeMap = [
      {
        metricKey: 'LINODE_ID',
        serviceName: 'linode',
      },
    ];
    if (Object.keys(metric).length == 0) {
      return props.widget.label + ' (' + props.widget.unit + ')';
    }

    metric.state = 'venkat';

    const results = flags.cloudPulseResourceTypeMap?.filter(
      (obj) => obj.serviceName == serviceType
    );

    const flag = results && results.length > 0 ? results[0] : undefined;
    let labelName = '';
    Object.keys(metric).forEach((key) => {
      if (flag && key == flag.metricKey) {
        labelName = labelName + metric[flag.metricKey] + '_';
      } else {
        labelName = labelName + metric[key] + '_';
      }
    });

    return labelName.slice(0, -1);
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
          label: getLabelName(graphData.metric, props.widget.service_type),
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

  if (isLoading || (status == 'success' && data.length == 0)) {
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

  const StyledZoomIcon = styled(ZoomIcon, {
    label: 'StyledZoomIcon',
  })({
    display: 'inline-block',
    float: 'right',
    marginLeft: '10px',
    marginTop: '10px',
  });

  return (
    <Grid xs={widget.size}>
      <Paper style={{ height: '98%', width: '100%' }}>
        {/* add further components like group by resource, aggregate_function, step here , for sample added zoom icon here*/}
        <div className={widget.metric} style={{ margin: '1%' }}>
          <StyledZoomIcon
            handleZoomToggle={handleZoomToggle}
            zoomIn={widget.size == 12 ? true : false}
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
            gridSize={props.widget.size}
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
