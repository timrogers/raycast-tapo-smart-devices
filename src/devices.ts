import find from "local-devices";
import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { cloudLogin, loginDeviceByIp, TapoDevice } from "tp-link-tapo-connect";

import { AvailableDevice, Device, DeviceStatusEnum, DeviceTypeEnum, Preferences } from "./types";
import { normaliseMacAddress } from "./utils";

const tapoDeviceTypeToDeviceType = (tapoDeviceType: string): DeviceTypeEnum => {
  switch (tapoDeviceType) {
    case "SMART.TAPOPLUG":
      return DeviceTypeEnum.Plug;
    case "SMART.TAPOBULB":
      return DeviceTypeEnum.Bulb;
    case "HOMEWIFISYSTEM":
      return DeviceTypeEnum.HomeWifiSystem;
    default:
      throw `Device type ${tapoDeviceType} not supported`;
  }
};

const tapoDeviceToDevice = (tapoDevice: TapoDevice): Device => ({
  id: tapoDevice.deviceId,
  type: tapoDeviceTypeToDeviceType(tapoDevice.deviceType),
  macAddress: tapoDevice.deviceMac,
  name: `Tapo ${tapoDevice.deviceName}`,
  alias: tapoDevice.alias,
  status: DeviceStatusEnum.Loading,
  isTurnedOn: null,
  ipAddress: null,
  loggedInDevice: null,
});

const isSupportedDevice = (device: Device): boolean =>
  device.type === DeviceTypeEnum.Plug || device.type === DeviceTypeEnum.Bulb;

export const getDevices = async (): Promise<Device[]> => {
  const { email, password } = await getPreferenceValues<Preferences>();

  const cloudApi = await cloudLogin(email, password);
  const tapoDevices = await cloudApi.listDevices();

  return tapoDevices.map(tapoDeviceToDevice).filter(isSupportedDevice);
};

export const turnDeviceOn = async (device: AvailableDevice): Promise<void> => {
  const toast = await showToast({ title: `Turning ${device.alias} on...`, style: Toast.Style.Animated });

  // We will only call this function with available, logged-in devices, so we can
  // assume that they key is there.
  await device.loggedInDevice.turnOn();

  toast.hide();
  await showToast({ title: `Turned ${device.alias} on.`, style: Toast.Style.Success });
};

export const turnDeviceOff = async (device: AvailableDevice): Promise<void> => {
  const toast = await showToast({ title: `Turning ${device.alias} off...`, style: Toast.Style.Animated });

  // We will only call this function with available, logged-in devices, so we can
  // assume that they key is there.
  await device.loggedInDevice.turnOff();

  toast.hide();
  await showToast({ title: `Turned ${device.alias} off.`, style: Toast.Style.Success });
};

export const locateDevicesOnLocalNetwork = async (devices: Device[]): Promise<Device[]> => {
  const localDevices = await find({ skipNameResolution: true, arpPath: "/usr/sbin/arp" });

  return devices.map((device) => {
    const localDevice = localDevices.find(
      (localDevice) => normaliseMacAddress(localDevice.mac) === normaliseMacAddress(device.macAddress),
    );

    if (localDevice) {
      const ipAddress = localDevice.ip;

      return { ...device, ipAddress, status: DeviceStatusEnum.Available };
    } else {
      return { ...device, status: DeviceStatusEnum.NotAvailable };
    }
  });
};

export const queryDevicesOnLocalNetwork = async (devices: Device[]): Promise<Device[]> => {
  const { email, password } = await getPreferenceValues<Preferences>();

  return Promise.all(
    devices.map(async (device) => {
      if (device.ipAddress) {
        const loggedInDevice = await loginDeviceByIp(email, password, device.ipAddress);
        const deviceInfo = await loggedInDevice.getDeviceInfo();
        const isTurnedOn = deviceInfo.device_on;

        return { ...device, loggedInDevice, isTurnedOn };
      } else {
        // We haven't been able to locate this device on the local network, so we won't
        // be able to query its state.
        return device;
      }
    }),
  );
};

export const isAvailableDevice = (device: Device): boolean => device.status === DeviceStatusEnum.Available;

export const getDeviceIcon = (device: Device): string => {
  switch (device.type) {
    case DeviceTypeEnum.Bulb:
      return "💡";
    case DeviceTypeEnum.Plug:
      return "🔌";
    default:
      throw `Icon unknown for device type ${device.type}`;
  }
};

export const getOnStateText = (device: Device): string | null => {
  if (device.isTurnedOn == null) {
    return null;
  } else if (device.isTurnedOn) {
    return "On";
  } else {
    return "Off";
  }
};
