/* eslint-disable no-console */
import * as React from 'react';

import { RegionSelect } from 'src/components/RegionSelect/RegionSelect';
import { useRegionsQuery } from 'src/queries/regions';

export interface CloudViewRegionSelectProps {
  handleRegionChange: (region: string | undefined) => void;
}

export const CloudViewRegionSelect = React.memo(
  (props: CloudViewRegionSelectProps) => {
    const { data: regions } = useRegionsQuery();
    const [selectedRegion, setRegion] = React.useState<string>();

    React.useEffect(() => {
      props.handleRegionChange(selectedRegion);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedRegion]);

    return (
      <RegionSelect
        handleSelection={(value) => {
          setRegion(value);
        }}
        currentCapability={undefined}
        fullWidth
        isClearable={false}
        label=""
        noMarginTop
        regions={regions ? regions : []}
        selectedId={null}
      />
    );
  }
);
