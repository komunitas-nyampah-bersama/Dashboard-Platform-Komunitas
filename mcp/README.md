# MCP Server untuk Dashboard Platform Komunitas

Server ini menyediakan akses berbasis [Model Context Protocol (MCP)] untuk mengonsumsi dataset dan file teks di repositori Dashboard Platform Komunitas melalui ChatGPT Actions atau klien MCP lainnya.

## Fitur Utama

- **Resource kontekstual**
  - `komunitas://docs/overview` → memuat isi lengkap `README.md`.
  - `komunitas://datasets/index` → menampilkan katalog dataset di folder `Master_json`.
  - `komunitas://external/supabase-mcp` → ringkasan konfigurasi bridge ke MCP Supabase.
- **Tool siap pakai**
  - `list-datasets` — mengembalikan daftar dataset JSON beserta URI MCP-nya.
  - `get-dataset` — membaca isi dataset tertentu dari `Master_json` dengan validasi keamanan.
  - `read-project-file` — mengakses file teks di repositori secara aman (hanya ekstensi yang diizinkan).
  - `search-repo` — melakukan pencarian teks menggunakan `ripgrep` untuk menemukan konteks terkait.
  - `supabase-mcp-request` — mem-proxy permintaan HTTP ke endpoint MCP Supabase yang ditentukan.

## Persyaratan

- Node.js 18 atau lebih baru.
- `ripgrep (rg)` tersedia di PATH untuk mendukung tool pencarian.

## Cara Menjalankan

```bash
npm install
npm run mcp
```

Server akan berjalan pada mode STDIO sehingga dapat langsung dikonsumsi oleh ChatGPT Actions. Pastikan client MCP mengarah ke skrip `node mcp/server.js` dan jalankan dari root repositori.

## Integrasi Supabase MCP

Server kini menyertakan bridge opsional ke proyek Supabase MCP eksternal (`https://mcp.supabase.com/mcp?project_ref=vyvcgejvmdejssaysiny&read_only=true`). Konfigurasi dilakukan via variabel lingkungan berikut:

| Variabel | Deskripsi |
| --- | --- |
| `SUPABASE_MCP_URL` | (Opsional) Ganti endpoint dasar Supabase MCP jika diperlukan. Default mengarah ke proyek read-only yang dibagikan. |
| `SUPABASE_MCP_ANON_KEY` / `SUPABASE_MCP_API_KEY` / `SUPABASE_MCP_SERVICE_ROLE_KEY` | (Opsional) Key Supabase yang akan dipakai sebagai `Authorization: Bearer` dan header `apikey`. Gunakan hanya kredensial yang aman dibagikan ke lingkungan Actions Anda. |
| `SUPABASE_MCP_HEADERS` | (Opsional) JSON string berisi header tambahan yang ingin dikirimkan (mis. `{ "x-client-info": "komunitas-mcp" }`). |

Gunakan tool `supabase-mcp-request` untuk meneruskan permintaan HTTP ke endpoint tersebut lengkap dengan parameter query, header kustom, dan body JSON jika dibutuhkan. Respons akan disajikan dalam bentuk teks dan struktur `structuredContent.response.json` (jika konten dapat diurai menjadi JSON).

> **Catatan jaringan:** lingkungan container pratinjau mungkin tidak dapat terhubung ke domain Supabase karena pembatasan proxy. Jalankan integrasi ini pada lingkungan Anda sendiri untuk menguji konektivitas secara penuh.

## Integrasi dengan ChatGPT Actions

1. Tambahkan entri baru pada konfigurasi Actions Anda yang memanggil `npm run mcp` sebagai perintah eksekusi.
2. Pilih transport STDIO ketika mendaftarkan server MCP pada ChatGPT.
3. Setelah terhubung, gunakan tool-tool yang tersedia untuk mengambil dataset atau membaca file proyek.

## Deployment ke GitHub

Anda dapat langsung mendorong (push) perubahan MCP server ini ke GitHub. Pastikan langkah-langkah berikut telah dipenuhi agar repositori siap dibagikan secara publik:

1. **Inisialisasi & Commit** – Pastikan `package.json`, direktori `mcp/`, dan berkas pendukung lain sudah berada di dalam repositori Git lalu lakukan commit.
2. **Rahasiakan kredensial** – Jangan pernah menuliskan nilai variabel lingkungan Supabase (API key) di dalam kode. Simpan pada Secrets GitHub atau variabel lingkungan ketika server dijalankan.
3. **Dokumentasi lengkap** – README ini telah memuat petunjuk menjalankan server dan integrasi Supabase; sertakan informasi tambahan di README root jika proyek utama membutuhkan konteks lebih luas.
4. **Uji lokal** – Jalankan `npm install` dan `npm run mcp` secara lokal untuk memastikan server bebas dari error sebelum di-push.

Setelah seluruh prasyarat terpenuhi, jalankan `git push origin <nama-branch>` untuk memublikasikan ke GitHub, kemudian Anda dapat membuka Pull Request atau menggabungkan sesuai alur kerja tim.

### Contoh Deploy ke `safwaindonesia91-ship-it/MCP-server`

Jika Anda ingin menyalin kode ini ke repositori GitHub baru milik akun `safwaindonesia91-ship-it`, ikuti urutan berikut:

1. **Buat repositori GitHub** – Anda dapat menggunakan tautan Codespaces siap pakai `https://codespaces.new/safwaindonesia91-ship-it/MCP-server` untuk membuat repositori dan Codespace baru sekaligus.
2. **Tambahkan remote baru** – Dari direktori proyek lokal ini jalankan:

   ```bash
   git remote add ship-it git@github.com:safwaindonesia91-ship-it/MCP-server.git
   ```

   Gunakan `https://github.com/safwaindonesia91-ship-it/MCP-server.git` jika Anda lebih nyaman dengan autentikasi HTTPS.
3. **Sinkronkan riwayat** – Pastikan commit lokal sudah bersih, lalu dorong branch utama (atau branch kerja Anda) ke remote baru:

   ```bash
   git push ship-it main
   ```

   Ganti `main` dengan nama branch yang ingin Anda gunakan di repositori tujuan.
4. **Konfigurasikan Secrets** – Buka tab *Settings → Secrets and variables → Actions* pada repositori baru tersebut, kemudian buat secrets untuk `SUPABASE_MCP_API_KEY` (atau variabel lain yang dibutuhkan). Secrets ini dapat diakses oleh GitHub Actions ataupun Codespaces tanpa perlu menuliskannya ke dalam kode.
5. **Verifikasi dari Codespaces** – Setelah Codespace terbuka, jalankan `npm install` dan `npm run mcp` di terminal Codespaces untuk memastikan server berjalan dengan benar pada lingkungan cloud GitHub.

Dengan langkah di atas, kode pada repositori ini akan siap dipakai dan diuji langsung dari GitHub Codespaces tujuan Anda.

## Struktur Output

- Semua tool mengembalikan `content` berupa teks yang siap dimasukkan ke konteks percakapan.
- Tool tertentu juga memberikan `structuredContent` untuk konsumsi programatis, mengikuti skema Zod yang didefinisikan pada server.

## Keamanan

- Akses file dibatasi pada tipe teks tertentu dan dicegah keluar dari root repositori.
- Direktori sensitif seperti `node_modules` dan `.git` diabaikan secara eksplisit.

Selamat menggunakan MCP server ini untuk memperkaya alur kerja riset dan pengembangan Anda.
