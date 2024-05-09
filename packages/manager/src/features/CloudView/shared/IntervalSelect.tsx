import * as React from 'react';

import { Autocomplete } from 'src/components/Autocomplete/Autocomplete';

export interface CloudViewIntervalSelectProps {
  className?: string;
  handleIntervalChange: (interval: string | undefined) => void;
  defaultValue?: string
}

export const CloudViewIntervalSelect = React.memo(
  (props: CloudViewIntervalSelectProps) => {
    const intervalOptions: any[] = [
      {
        label: '1 min',
        value: '1minute',
      },
      {
        label: '5 min',
        value: '5minute',
      },
      {
        label: '2 hrs',
        value: '2hour',
      },
      {
        label: '1 day',
        value: '1day',
      },
    ];

    const defaultValue = intervalOptions.find((interval, index) => interval.label===props.defaultValue)

    const [selectedInterval, setInterval] = React.useState<string>(defaultValue?.value ?? '1minute');

    React.useEffect(() => {
      props.handleIntervalChange(selectedInterval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedInterval]);

    return (
      <Autocomplete
        onChange={(_: any, timeInterval: any) => {
          setInterval(timeInterval.value);
        }}
        className={props.className}
        data-testid="cloudview-interval-select"
        defaultValue={defaultValue ?? intervalOptions[0]}
        disableClearable
        fullWidth={false}
        isOptionEqualToValue={(option, value) => option.label === value.label}
        label=""
        noMarginTop={true}
        options={intervalOptions}
      />
    );
  }
);
