import { GetJWETokenPayload, TimeDuration } from '@linode/api-v4';

import { WithStartAndEnd } from 'src/features/Longview/request.types';
import { useFlags } from 'src/hooks/useFlags';
import { ACLP_SERVICES_FOR_REGION_FILTER } from './CloudPulseConstants';

export const mapResourceIdToName = (id: string, resources: any[]) => {
  if (!resources || resources.length == 0) {
    return id;
  }

  if (!id) {
    return '';
  }

  const index = resources.findIndex(
    (resourceObj) => resourceObj.id && resourceObj.id == id
  );

  // if we are able to find a match, then return the label, else return id
  return index != -1 ? resources[index].label : id;
};

export const getDimensionName = (metric: any, flag: any, resources: any[]) => {
  let labelName = '';
  Object.keys(metric).forEach((key) => {
    if (flag && key == flag.dimensionKey) {
      const mappedName = mapResourceIdToName(metric[flag.dimensionKey], resources);

      if (mappedName && mappedName.length > 0) {
        labelName =
          labelName +
          mapResourceIdToName(metric[flag.dimensionKey], resources) +
          '_';
      }
    } else if (metric[key]) {
      labelName = labelName + metric[key] + '_';
    }
  });

  return labelName.slice(0, -1);
};

// returns a list of resource IDs to be passed as part of getJWEToken call
export const getResourceIDsPayload = (resources: any) => {
  const jweTokenPayload: GetJWETokenPayload = {
    resource_id: [],
  };

  if (resources?.data) {
    jweTokenPayload.resource_id = resources?.data?.map(
      (resource: any) => resource.id
    );
  }
  return jweTokenPayload;
};

export const convertTimeDurationToStartAndEndTimeRange = (
  timeDuration: TimeDuration
) => {
  const startEnd: WithStartAndEnd = { end: 0, start: 0 };
  const nowInSeconds = Date.now() / 1000;
  startEnd.end = nowInSeconds;
  if (timeDuration.unit == 'hr') {
    startEnd.start = nowInSeconds - timeDuration.value * 60 * 60;
  }

  if (timeDuration.unit == 'min') {
    startEnd.start = nowInSeconds - timeDuration.value * 60;
  }

  if (timeDuration.unit == 'day') {
    startEnd.start = nowInSeconds - timeDuration.value * 24 * 60 * 60;
  }

  return startEnd;
};

export const convertStringToCamelCasesWithSpaces = (
  nonFormattedString: string
): string => {
  if (nonFormattedString && nonFormattedString.length > 0) {
    const splitString = nonFormattedString.split(' ');

    return splitString
      .map((text) => text[0].toUpperCase() + text.slice(1))
      .join(' ');
  }

  return nonFormattedString;
};

export const removeObjectReference = (object: any)=> {
  if (!object) {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(object));
  } catch (e) {
    return null;
  }
}

export const isRegionApplicable = (serviceType : string | undefined) : boolean=>{
  const flags = useFlags();

  let isRegionApplicable = true;

  if(serviceType &&flags && flags[ACLP_SERVICES_FOR_REGION_FILTER]){
    const services  :Array<string> = flags[ACLP_SERVICES_FOR_REGION_FILTER];

    if(services.indexOf(serviceType) === -1){
      isRegionApplicable = false;
    }
  }
  return isRegionApplicable;
}
