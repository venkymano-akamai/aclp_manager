/* eslint-disable no-console */
import * as React from 'react';

import Select from 'src/components/EnhancedSelect/Select';
import { RegionSelect } from 'src/components/RegionSelect/RegionSelect';
import { useRegionsQuery } from 'src/queries/regions';

export interface CloudViewRegionSelectProps {
  handleRegionChange: (region: string | undefined) => void;
  preferredRegionId?: any;
}

export const CloudViewRegionSelect = React.memo(
  (props: CloudViewRegionSelectProps) => {
    console.log('region pref', props.preferredRegionId);
    const { data: regions, error, isLoading } = useRegionsQuery();

    const errorText: string = error ? 'Error loading regions' : '';

    const getPreferredRegion = () => {
      const prefRegion = localStorage.getItem('region') ? JSON.parse(localStorage.getItem('region')!): undefined;
      console.log(regions);
      const preferredOption = regions?.find(
        (region: any) => region?.id === prefRegion
      );
      if (prefRegion) {
        props.handleRegionChange(prefRegion);
      }
      return preferredOption;
    };

    const [selectedRegion, setRegion] = React.useState<string | undefined>(
      getPreferredRegion()
    );

    React.useEffect(() => {
      props.handleRegionChange(selectedRegion);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRegion]);

    if (isLoading) {
      return (
        <Select
          isClearable={true}
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onChange={() => {}}
          placeholder="Select a Region"
        />
      );
    }
    return (
      <RegionSelect
        handleSelection={(value) => {
          setRegion(value);
          console.log('region pref select:', value);
          localStorage.setItem('region', JSON.stringify(value));
        }}
        currentCapability={undefined}
        errorText={errorText}
        fullWidth
        isClearable={true}
        label=""
        noMarginTop
        regions={regions ? regions : []}
        selectedId={getPreferredRegion()?.id}
        // onChange={(_: any, value: any) => {
        //   setRegion(value);
        //   // console.log('resources:', resource);
        //   localStorage.setItem('region', JSON.stringify(value));
        // }}
      />
    );
  }
);
