# Integrasi Dashboard Codex untuk Otomasi Komunitas

Dokumen ini merangkum tiga jalur integrasi yang dapat diaktifkan dari Zapier MCP menuju Dashboard Codex Anda. Tujuannya adalah menyediakan orkestrasi data yang seragam untuk automasi komunitas lintas kanal (Telegram, WhatsApp, dan kanal internal dashboard).

## 1. Webhook Real-time ke Dashboard Codex

| Komponen | Detail |
| --- | --- |
| **Endpoint** | `https://your-codex-dashboard.com/api/community/webhook` |
| **Metode** | `POST` |
| **Payload** | JSON (status sistem, statistik, daftar grup/channel, log aktivitas) |
| **Kapan Dipanggil** | Setiap Zapier menjalankan kode Python backend |

### Contoh Payload
```json
{
  "status": {
    "timestamp": "2024-03-01T10:15:00Z",
    "system": "operational",
    "active_members": 1284
  },
  "groups": [
    { "id": "g-001", "name": "TechCommunity Core", "members": 150 },
    { "id": "g-002", "name": "Beta Testers", "members": 84 }
  ],
  "channels": [
    { "id": "c-tele-01", "platform": "Telegram", "topic": "Announcement" },
    { "id": "c-wa-05", "platform": "WhatsApp", "topic": "Campaign" }
  ],
  "analytics": {
    "engagement_rate": 0.42,
    "weekly_growth": 0.08
  },
  "activity_logs": [
    {
      "id": "log-9931",
      "actor": "bot",
      "action": "broadcast",
      "target": "whatsapp_campaign",
      "result": "queued"
    }
  ]
}
```

### Contoh Handler (Python Flask)
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.post("/api/community/webhook")
def receive_zapier_data():
    data = request.get_json(force=True)
    update_dashboard_widgets(data)
    persist_activity_log(data.get("activity_logs", []))
    return jsonify({"status": "received"})
```

Pastikan fungsi `update_dashboard_widgets` dan `persist_activity_log` menulis data ke storage yang dibaca komponen front-end dashboard.

## 2. Google Sheets untuk Analytics Historis

| Komponen | Detail |
| --- | --- |
| **Spreadsheet** | `Master data safwa universty indonesia` |
| **Worksheet rekomendasi** | `Analytics`, `Members`, `Campaigns` |
| **Akses** | OAuth 2.0 dengan layanan `Google Sheets API` |
| **Penggunaan** | Menyimpan snapshot metrik berkala untuk tren jangka panjang |

### Alur Kerja
1. Step `Code by Zapier (Python)` mengemas data analytics.
2. Step `Google Sheets > Create Spreadsheet Row` menyisipkan record baru.
3. Dashboard Codex membaca data melalui service account menggunakan `gspread` atau `googleapiclient`.

### Contoh Pembacaan Data
```python
import gspread
from google.oauth2.service_account import Credentials

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
creds = Credentials.from_service_account_file("service-account.json", scopes=SCOPES)
client = gspread.authorize(creds)
sheet = client.open("Master data safwa universty indonesia").worksheet("Analytics")
analytics_records = sheet.get_all_records()
```

Gunakan `analytics_records` untuk menampilkan grafik pertumbuhan, segmentasi, atau KPI lainnya di dashboard.

## 3. Zapier Tables sebagai Basis Data Operasional

| Komponen | Detail |
| --- | --- |
| **Table** | `Sistem Perkuliahan` |
| **Kolom Umum** | `member_id`, `name`, `role`, `last_activity`, `tags`, `notes` |
| **Akses** | Zapier Tables API (token Zapier CLI) |
| **Penggunaan** | Menyimpan data terstruktur yang membutuhkan query fleksibel |

### Contoh Pengambilan Data
```python
import requests

ZAPIER_TABLE_ID = "tbl_xxxxxxxxx"
ZAPIER_API_KEY = "zapier_xxx"

response = requests.get(
    f"https://api.zapier.com/v2/tables/{ZAPIER_TABLE_ID}/records",
    headers={"Authorization": f"Bearer {ZAPIER_API_KEY}"}
)
response.raise_for_status()
records = response.json().get("records", [])
```

### Integrasi ke Dashboard
- Sinkronkan records ke database internal atau cache.
- Gunakan query parameter API Zapier Tables untuk memfilter data berdasarkan `tags` atau `last_activity`.
- Render modul manajemen anggota/kelas langsung dari dataset ini agar admin dapat melakukan tindakan (aktifasi, penonaktifan, pembaruan metadata).

## Orkestrasi Antar-Integrasi

1. **Zap Trigger**: Bot Telegram TechCommunity memicu webhook ke Zapier.
2. **Python Backend**: Mengumpulkan data komunitas, memvalidasi template WhatsApp, dan menyiapkan payload terpadu.
3. **Distribusi Data**:
   - Kirim snapshot real-time ke endpoint webhook dashboard.
   - Arsipkan ringkasan analitik ke Google Sheets.
   - Perbarui atau buat record di Zapier Tables.
4. **Monitoring**: Dashboard Codex menarik data dari ketiga sumber untuk menampilkan status, tren historis, dan detail operasional.

Dengan konfigurasi ini, Dashboard Codex mendapatkan visibilitas penuh atas automasi komunitas, mulai dari aktivitas real-time hingga pelacakan historis dan pengelolaan basis data anggota.
