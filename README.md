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

## Inventory analytics

Open **Analytics** in the sidebar (`/analytics`). Screenshot: add a capture of the analytics page here after deploy.

The API computes stats in MongoDB instead of downloading every document to the browser.

Typical pipeline stages:

- `$addFields` — fill missing `quantity` / `minimumStock` (default **5**) and classify stock
- `$facet` — run totals, category groups, status groups, and alerts together
- `$group` — collapse rows by category, stock bucket, or status
- `$project` — rename `_id` groups into API fields
- `$match` — keep only low-stock and out-of-stock rows
- `$sort` — out-of-stock first, then lowest quantity

`GET /api/analytics/overview` sample:

```json
{
  "totalRecords": 3,
  "totalUnits": 20,
  "categoryDistribution": [
    { "category": "Microcontroller", "recordCount": 2, "unitCount": 10 }
  ],
  "stockSummary": { "healthy": 1, "lowStock": 1, "outOfStock": 1 },
  "lowStockCount": 1,
  "outOfStockCount": 1,
  "deploymentStatistics": {
    "availableRecords": 2,
    "deployedRecords": 1,
    "unitsOnAvailableRecords": 13,
    "unitsOnDeployedRecords": 7
  },
  "lowStockComponents": []
}
```

**Records vs units:** a record is one SKU document. `quantity` is the total unit count on that record. `status` is record-level (`Available` or `Deployed`), so “deployed units” means units on Deployed records, not a split of one SKU.

**Stock rules:** `quantity <= 0` out of stock; `0 < quantity <= minimumStock` low stock; otherwise healthy. Legacy documents without `minimumStock` use 5.

Category / location / status filters on the analytics page are a future enhancement; inventory search filters still apply on the main table.

### Example JSON

```json
{
  "name": "ESP32 DevKit",
  "category": "Microcontroller",
  "manufacturer": "Espressif",
  "quantity": 4,
  "minimumStock": 5,
  "status": "Available",
  "location": "Drawer A",
  "notes": "Wi-Fi + Bluetooth module",
  "architecture": "Xtensa LX6",
  "operatingVoltage": 3.3,
  "communicationProtocols": ["UART", "SPI", "I2C", "Wi-Fi", "Bluetooth"],
  "datasheetUrl": "https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf"
}
```

## QR tracking

Every inventory record already has a MongoDB `_id`. That value is the stable QR identity. Nothing extra is stored in the database.

1. The app builds a public URL: `https://iot-component-vault.vercel.app/components/<componentId>`
2. The `qrcode` package draws that URL as a QR image in the browser (not saved in MongoDB).
3. A phone camera opens the URL. Vercel serves `index.html` (SPA rewrite), React Router loads `/components/:id`, and the page fetches `GET /api/components/:id`.

Edits to name, quantity, location, or hardware metadata do not change `_id`, so printed labels stay valid.

### Example detail URL

```
https://iot-component-vault.vercel.app/components/64b1c2d3e4f5a6b7c8d9e0f1
```

Set `VITE_PUBLIC_APP_URL` to that Vercel origin so **Download PNG** and **Print label** never encode `localhost`. Local `npm run dev` still uses `VITE_API_URL` for data.

### Printing labels

1. Open inventory → QR icon on a row.
2. Confirm the encoded URL is the Vercel domain.
3. **Download PNG** for a 1024px white-background image (`Arduino-Uno-R3-QR.png`).
4. **Print label** for a 70 mm × 40 mm card: name, short ID, QR, category, location.

### Known limitations and security

- There is **no login yet**. The inventory list API still returns full records, including notes and locations, to the dashboard.
- The scan page and `GET /api/components/:id` omit notes and storage location so a random scan does not show lab internals. Edit and delete stay on the dashboard only.
- QR codes contain only the public frontend URL and component ID. They never include MongoDB credentials or API URLs.
- Follow-up: add authentication before treating the list API as private.

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

1. Commit and push to GitHub.
2. Render (`backend`): start `npm start`. Set `MONGODB_URI`, `CLIENT_URL=https://iot-component-vault.vercel.app`. Render provides `PORT`.
3. Vercel (`client`): Root Directory `client`. Set `VITE_API_URL` to the Render API and `VITE_PUBLIC_APP_URL=https://iot-component-vault.vercel.app`, then **redeploy** so QR links and the API client pick up the values. `client/vercel.json` rewrites `/components/:id` to `index.html`.
