export const ARCHITECTURE_SUGGESTIONS = [
  "ARM Cortex-M4",
  "ARM Cortex-M7",
  "AVR 8-bit",
  "RISC-V",
  "Xtensa LX6",
  "ARM Cortex-A72",
];

export const PROTOCOLS = [
  "UART",
  "SPI",
  "I2C",
  "CAN",
  "USB",
  "Ethernet",
  "Wi-Fi",
  "Bluetooth",
  "GPIO",
  "PWM",
  "Other",
];

export const displayProtocol = (protocol) =>
  protocol === "I2C" ? "I²C" : protocol;
