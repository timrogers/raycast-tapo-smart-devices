import { Icon, MenuBarExtra } from "@raycast/api";
import { useEffect, useState } from "react";

import { AvailableDevice, Device } from "./types";
import {
  getDeviceIcon,
  getDevices,
  getOnStateText,
  isAvailableDevice,
  locateDevicesOnLocalNetwork,
  queryDevicesOnLocalNetwork,
  turnDeviceOn,
  turnDeviceOff,
} from "./devices";
import { split } from "./utils";

const refreshDevices = async (
  setDevicesFn: (devices: Device[]) => void,
  setIsLoadingFn: (isLoading: boolean) => void
): Promise<void> => {
  let devices;

  try {
    devices = await getDevices();
  } catch (error) {
    setIsLoadingFn(false);
    return;
  }

  const locatedDevices = await locateDevicesOnLocalNetwork(devices);
  const augmentedLocatedDevices = await queryDevicesOnLocalNetwork(locatedDevices);
  setDevicesFn(augmentedLocatedDevices);

  const availableDevices = augmentedLocatedDevices.filter(isAvailableDevice);

  setIsLoadingFn(false);
};

const AvailableDeviceMenuBarItem = (props: { device: AvailableDevice; refreshFn: () => void }): JSX.Element => {
  const { device, refreshFn } = props;

  return (
    <MenuBarExtra.Item
      title={`${device.alias} (${getOnStateText(device)})`}
      key={device.id}
      icon={getDeviceIcon(device)}
      tooltip={device.name}
      onAction={() => {
        if (device.isTurnedOn) {
          turnDeviceOff(device).then(refreshFn);
        } else {
          turnDeviceOn(device).then(refreshFn);
        }
      }}
    />
  );
};

export default function Command() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    refreshDevices(setDevices, setIsLoading);
  }, []);

  const [availableDevices, unavailableDevices] = split(devices, isAvailableDevice);

  return (
    <MenuBarExtra icon={Icon.LightBulb} isLoading={isLoading} tooltip="Tapo Smart Devices">
      {availableDevices.length &&
        availableDevices.map((device) => (
          <AvailableDeviceMenuBarItem
            device={device}
            key={device.id}
            refreshFn={() => {
              setIsLoading(true);
              refreshDevices(setDevices, setIsLoading);
            }}
          />
        ))}
      {unavailableDevices.length && (
        <MenuBarExtra.Submenu icon={Icon.XMarkCircle} title="Unavailable">
          {unavailableDevices.map((device) => (
            <MenuBarExtra.Item
              title={device.alias}
              key={device.id}
              icon={getDeviceIcon(device)}
              tooltip={device.name}
            />
          ))}
        </MenuBarExtra.Submenu>
      )}
    </MenuBarExtra>
  );
}
