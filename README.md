# IoT Dev Board & Component Vault

MERN inventory app for microcontroller boards, sensors, development kits, and IoT modules.

- Frontend: React + Vite (`client/`), deployed on Vercel
- Backend: Express + Mongoose (`backend/`), deployed on Render
- Database: MongoDB Atlas

## Hardware metadata

Existing inventory fields are unchanged. These **optional** hardware fields can be stored on any component. Older MongoDB documents remain valid without them; no migration is required.

| Field | Type | Notes |
| --- | --- | --- |
| `architecture` | string | Free text with suggestions such as ARM Cortex-M4, AVR 8-bit, RISC-V, Xtensa LX6 |
| `operatingVoltage` | number | Volts (V). Must be 0 or greater |
| `communicationProtocols` | string[] | `UART`, `SPI`, `I2C`, `CAN`, `USB`, `Ethernet`, `Wi-Fi`, `Bluetooth`, `GPIO`, `PWM`, `Other`. Stored as `I2C`, shown as I²C |
| `datasheetUrl` | string | Optional `http://` or `https://` URL |

The dashboard search matches architecture and protocols. A protocol filter sits next to category and status. Expand a table row to view hardware specifications.

### Example JSON

```json
{
  "name": "ESP32 DevKit",
  "category": "Microcontroller",
  "manufacturer": "Espressif",
  "quantity": 4,
  "status": "Available",
  "location": "Drawer A",
  "notes": "Wi-Fi + Bluetooth module",
  "architecture": "Xtensa LX6",
  "operatingVoltage": 3.3,
  "communicationProtocols": ["UART", "SPI", "I2C", "Wi-Fi", "Bluetooth"],
  "datasheetUrl": "https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf"
}
```

## Local development

```bash
cd backend
npm install
npm run dev
```

```bash
cd client
npm install
npm run dev
```

API: `http://localhost:5000`  
UI: `http://localhost:5173`

Copy `backend/.env.example` to `backend/.env` and `client/.env.example` to `client/.env`. Do not commit secrets.

```bash
cd backend
npm test
```

```bash
cd client
npm run build
```

## Deploy

1. Push to GitHub.
2. Render web service: root directory `backend`, start command `npm start`. Set `MONGODB_URI`, `CLIENT_URL` (your Vercel origin), and `PORT` (Render provides this).
3. Vercel project: root `client`. Set `VITE_API_URL` to the Render API URL, then redeploy so the frontend picks it up.
