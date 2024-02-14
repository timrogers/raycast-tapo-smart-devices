import { loginDeviceByIp } from "tp-link-tapo-connect";

type PromiseType<T extends Promise<unknown>> = T extends Promise<infer U> ? U : never;

export type LoggedInDevice = PromiseType<ReturnType<typeof loginDeviceByIp>>;

export enum DeviceTypeEnum {
  Bulb = "bulb",
  Plug = "plug",
  HomeWifiSystem = "home_wifi_system",
}

export enum DeviceStatusEnum {
  Loading = "loading",
  Available = "available",
  NotAvailable = "not_available",
}

export interface Preferences {
  email: string;
  password: string;
}

export interface Device {
  id: string;
  type: DeviceTypeEnum;
  macAddress: string;
  name: string;
  alias: string;
  status: DeviceStatusEnum;
  isTurnedOn: boolean | null;
  ipAddress: string | null;
  loggedInDevice: LoggedInDevice | null;
}

export interface AvailableDevice extends Device {
  ipAddress: string;
  loggedInDevice: LoggedInDevice;
}
