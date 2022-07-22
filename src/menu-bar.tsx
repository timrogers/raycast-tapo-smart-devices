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

export default function Command() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    refreshDevices(setDevices, setIsLoading);
  }, []);

  const [availableDevices, _unavailableDevices] = split(devices, isAvailableDevice);

  if (availableDevices.length) {
    return (
      <MenuBarExtra icon={Icon.LightBulb} tooltip="Tapo Smart Devices">
        <MenuBarExtra.Item title="Available" />
        {availableDevices.map((device) => (
          <MenuBarExtra.Item
            title={`${device.alias} (${getOnStateText(device)})`}
            key={device.id}
            icon={getDeviceIcon(device)}
            tooltip={device.name}
            onAction={() => {
              console.log("* LOLOL");
            }}
          />
        ))}
      </MenuBarExtra>
    );
  } else {
    return <MenuBarExtra icon={Icon.LightBulb} isLoading={isLoading} tooltip="Tapo Smart Devices" />;
  }
}
