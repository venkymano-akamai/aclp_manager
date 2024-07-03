import {
  Dashboard,
  GetJWETokenPayload,
  JWEToken,
  getDashboardById,
  getDashboards,
  getJWEToken,
} from '@linode/api-v4';
import { APIError, ResourcePage } from '@linode/api-v4/lib/types';
import { UseQueryOptions, useQueries, useQuery } from '@tanstack/react-query';

export const queryKey = 'cloudview-dashboards';

export const useCloudViewDashboardByIdQuery = (
  dashboardId: number | undefined,
  key: boolean | undefined
) => {
  return useQuery<Dashboard, APIError[]>(
    [queryKey, dashboardId, key], // querykey and dashboardId makes this uniquely identifiable
    () => getDashboardById(dashboardId!),
    {
      enabled: dashboardId != undefined,
    } // run this only if dashboarID is valid one
  );
};

export const useCloudViewDashboardsQuery = (serviceTypes: string[]) => {
  return useQueries({
    queries: serviceTypes?.map<
      UseQueryOptions<ResourcePage<Dashboard>, APIError[]>
    >((serviceType) => ({
      enabled: serviceTypes.length > 0,
      queryFn: () => getDashboards(serviceType),
      queryKey: [queryKey, serviceType],
      retry: 0,
    })),
  });
};

export const useCloudViewJWEtokenQuery = (
  serviceType: string,
  request: GetJWETokenPayload,
  runQuery: boolean
) => {
  return useQuery<JWEToken, APIError[]>(
    ['jwe-token', serviceType],
    () => getJWEToken(request, serviceType),
    {
      enabled: runQuery,
      keepPreviousData: true,
      refetchOnWindowFocus: false,
    }
  );
};
