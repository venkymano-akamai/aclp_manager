/* eslint-disable no-console */
import * as React from 'react';

import { Autocomplete } from 'src/components/Autocomplete/Autocomplete';
import Select from 'src/components/EnhancedSelect/Select';
import {
  useLinodeResourcesQuery,
  useLoadBalancerResourcesQuery,
} from 'src/queries/cloudview/resources';

interface CloudViewResourceSelectProps {
  disabled: boolean;
  handleResourceChange: (resource: any) => void;
  region: string | undefined;
  resourceIds?: number[];
  resourceType: string | undefined;
}

export const CloudViewMultiResourceSelect = (
  props: CloudViewResourceSelectProps
) => {
  const resourceOptions: any = {};

  const filterResourcesByRegion = (resourcesList: any[]) => {
    return resourcesList?.filter((resource: any) => {
      if (resource.region) {
        return resource.region === props.region;
      } else if (resource.regions) {
        return resource.regions.includes(props.region);
      } else {
        return false;
      }
    });
  };

  const getResourceList = () => {
    if (props.region) {
      return props.resourceType && resourceOptions[props.resourceType]
        ? filterResourcesByRegion(resourceOptions[props.resourceType]?.data)
        : [];
    }
    return props.resourceType && resourceOptions[props.resourceType]
      ? resourceOptions[props.resourceType]?.data
      : [];
  };

  ({ data: resourceOptions['linode'] } = useLinodeResourcesQuery(
    props.resourceType === 'linode'
  ));
  ({ data: resourceOptions['aclb'] } = useLoadBalancerResourcesQuery(
    props.resourceType === 'aclb'
  ));

  const prefResourceIds = localStorage.getItem('resources') ? JSON.parse(localStorage.getItem('resources')!).map(
    (resource: any) => resource.id
  ): [];
  const getPreferredResources = () => {
    const preferredResources = getResourceList().filter((resource: any) =>
      prefResourceIds?.includes(resource.id)
    );
    // if (preferredResources) setResource([...preferredResources]);
    console.log(preferredResources);
    return preferredResources;
  };

  const [selectedResource, setResource] = React.useState<any>([]);

  console.log(selectedResource);
  const [resourceInputValue, setResourceInputValue] = React.useState('');
  React.useEffect(() => {
    props.handleResourceChange(selectedResource);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedResource]);

  React.useEffect(() => {
    setResource([]);
    setResourceInputValue('');
    props.handleResourceChange([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.resourceType, props.region]);

  if (!resourceOptions['linode']) {
    return (
      <Select
        isClearable={true}
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        onChange={() => {}}
        placeholder="Select resources"
      />
    );
  }
  return (
    <Autocomplete
      onChange={(_: any, resource: any) => {
        setResource(resource);
        // console.log('resources:', resource);
        localStorage.setItem('resources', JSON.stringify(resource));
      }}
      onInputChange={(event, newInputValue) => {
        setResourceInputValue(newInputValue);
        setResource(newInputValue);
        // console.log('resources:', resource);
        localStorage.setItem('resources', JSON.stringify(newInputValue));
      }}
      autoHighlight
      clearOnBlur
      // defaultValue={getResourceList()}
      disabled={props.disabled}
      inputValue={resourceInputValue}
      isOptionEqualToValue={(option, value) => option.label === value.label}
      label=""
      limitTags={2}
      multiple
      options={getResourceList()}
      placeholder="Select a resource"
      value={getPreferredResources()}
      onMouseMove={() => {
        // setResourceInputValue(newInputValue);
        setResource(getPreferredResources());
        // console.log('resources:', resource);
      }}
    />
  );
};
