# Dashboard Platform Komunitas Nyampah Bersama 2BCycle

Platform berbasis blockchain untuk komunitas riset desentralisasi yang mengintegrasikan PoAV, 2BCycle, dan ekonomi sirkular untuk menciptakan perubahan lingkungan yang berkelanjutan.

![Dashboard Preview](https://komunitas-nyampah-bersama.github.io/Dashboard-Platform-Komunitas/screenshot.png)

## Struktur Proyek
Dashboard-Platform-Komunitas/

├── index.html              # Halaman utama

├── 404.html               # Halaman error kustom
├── .gitignore             # File yang diabaikan Git
├── LICENSE                # Lisensi proyek
├── README.md              # Dokumentasi proyek
└── assets/                # Folder untuk aset
    ├── css/               # File CSS
    ├── js/                # File JavaScript
    └── images/            # Gambar yang digunakan
    

## Fitur Utama

✅ **Integrasi Blockchain**  
- Dashboard blockchain dengan informasi wallet, transaksi, dan kontrak cerdas
- Tokenisasi aksi lingkungan menjadi token digital
- Sistem reward berbasis blockchain
- Tabel transaksi blockchain terbaru

📱 **Responsif**  
- Didesain untuk semua perangkat (desktop, tablet, mobile)
- Navigasi mobile-friendly dengan menu hamburger
- Layout yang beradaptasi dengan berbagai ukuran layar

🎨 **Modern UI/UX**  
- Animasi halus untuk pengalaman pengguna yang lebih baik
- Desain warna yang konsisten dengan tema lingkungan
- Ikon FontAwesome untuk visualisasi yang jelas
- Tampilan kartus interaktif dengan efek hover

📊 **Fitur Interaktif**  
- Dashboard anggota dengan statistik kontribusi
- Leaderboard komunitas
- Modal login untuk EU Survey
- FAQ section yang dapat diperluas
- Galeri dokumentasi kegiatan

## Teknologi yang Digunakan

- **HTML5** - Struktur dasar halaman web
- **CSS3** - Styling dan layout responsif
- **JavaScript** - Logika interaktif dan animasi
- **Font Awesome** - Ikon vektor
- **Google Fonts** - Tipografi modern (Poppins dan Roboto)

## Integrasi GPT melalui MCP Zapier

Apabila instans GPT Anda sudah tersambung ke konektor **Zapier MCP**, koneksi tersebut dapat dimanfaatkan untuk menjembatani berbagai aplikasi pihak ketiga (misalnya WhatsApp, Telegram, Google Sheets, Slack, dan sejenisnya) melalui alur otomatis (*Zap*). Gambaran umum integrasinya adalah sebagai berikut:

1. **Pilih pemicu (trigger)** di Zapier yang berasal dari GPT/MCP (misalnya perintah tertentu yang diterima model atau perubahan status percakapan).
2. **Hubungkan aksi (action)** menuju aplikasi target yang tersedia di katalog Zapier. Untuk WhatsApp, gunakan layanan resmi yang memiliki integrasi Zapier seperti Twilio WhatsApp API, 360dialog, Zenvia, atau penyedia Business API lain yang sudah Anda daftarkan sebelumnya.
3. **Konfigurasikan autentikasi dan payload** sesuai kebutuhan aplikasi tujuan (pesan teks, lampiran, parameter dinamis dari percakapan GPT, dsb.).
4. **Uji coba Zap** untuk memastikan data mengalir dari GPT ke aplikasi pihak ketiga dengan benar sebelum diaktifkan secara penuh.

> **Catatan penting:** WhatsApp Business API mensyaratkan akun terverifikasi serta penyedia resmi. Zapier tidak dapat mengirimkan pesan langsung ke nomor WhatsApp pribadi tanpa perantara API resmi, sehingga pastikan Anda telah menyiapkan kredensial dan persetujuan yang sesuai dari Meta.

Dengan pola di atas, Anda juga bisa menambahkan beberapa aksi berantai (misalnya menyimpan log ke Google Sheets, mengirim email tindak lanjut, atau memicu webhook lain) sehingga alur kerja komunitas tetap terdokumentasi dengan baik.

> **Butuh orkestra yang lebih kaya untuk WhatsApp?** Lihat panduan [Integrasi Dashboard WhatsApp Melalui Telegram TechCommunity](docs/whatsapp_automation_dashboard.md) untuk skenario di mana grup Telegram menjadi pusat komando yang memicu otomasi WhatsApp melalui Zapier MCP dan backend Python Anda.

## Integrasi Dashboard Codex

- **[Integrasi Dashboard Codex untuk Otomasi Komunitas](docs/codex_dashboard_integrations.md)** — rangkuman tiga jalur integrasi (webhook real-time, Google Sheets analytics, dan Zapier Tables) yang menghubungkan backend Python, Zapier MCP, dan dashboard untuk pengelolaan komunitas lintas kanal.

## Cara Menjalankan Proyek

1. Clone repositori ini:
```bash
git clone https://github.com/komunitas-nyampah-bersama/Dashboard-Platform-Komunitas.git
cd Dashboard-Platform-Komunitas
```

2. Pasang dependensi Node.js untuk tooling linting TypeScript:
```bash
npm install
```

3. (Opsional) Siapkan kredensial Supabase apabila Anda ingin menjalankan middleware Next.js di lingkungan pengembangan. Salin `.env.example` (lihat di bawah jika belum ada) menjadi `.env.local` kemudian isi variabel berikut:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="public-anon-key"
```

Variabel ini hanya dibaca oleh utilitas middleware untuk menguji integrasi Supabase. Jika tidak disediakan, middleware secara otomatis melewati pembuatan klien.

4. Jalankan pemeriksaan lint untuk memastikan setup berhasil:
```bash
npm run lint
```

5. Untuk mempratinjau antarmuka statis dashboard, gunakan ekstensi *Live Server* pada VS Code atau jalankan HTTP server sederhana:
```bash
npx http-server . -p 3000
```
Setelah server aktif, buka `http://localhost:3000/index.html` di peramban Anda.

## Berkas Contoh Lingkungan

Apabila Anda memerlukan berkas contoh, buat `.env.example` dengan struktur berikut sehingga rekan satu tim dapat menyalinnya saat setup:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
