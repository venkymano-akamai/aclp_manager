import { ResourcePage } from 'src/types';
// import { API_ROOT } from '../constants';

import Request, { setMethod, setURL, setData, setHeaders } from '../request';
import { Dashboard, JWEToken, GetJWETokenPayload } from './types';

export const getDashboardById = (dashboardId?: number) =>
  Request<Dashboard>(
    setURL(
      `https://blr-lhv95n.bangalore.corp.akamai.com:9000/v4/monitor/dashboards/${encodeURIComponent(dashboardId!)}`
    ),
    setMethod('GET'),
    setHeaders({
      Authorization: 'Bearer vagrant',
    })
  );

export const getDashboards = (serviceType: string) =>
  Request<ResourcePage<Dashboard>>(
    setURL(
      `https://blr-lhv95n.bangalore.corp.akamai.com:9000/v4/monitor/services/linode/dashboards`
    ),
    setMethod('GET'),
    setHeaders({
      Authorization: 'Bearer vagrant',
    })
  );

export const getJWEToken = (data: GetJWETokenPayload, serviceType: string) =>
  Request<JWEToken>(
    setURL(
      `https://blr-lhv95n.bangalore.corp.akamai.com:9000/v4/monitor/services/${encodeURIComponent(
        serviceType
      )}/token`
    ),
    setMethod('POST'),
    setData(data),
    setHeaders({
      Authorization: `Bearer mlishuser`,
    })
  );
