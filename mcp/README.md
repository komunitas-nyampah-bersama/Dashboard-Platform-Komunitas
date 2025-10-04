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

## Struktur Output

- Semua tool mengembalikan `content` berupa teks yang siap dimasukkan ke konteks percakapan.
- Tool tertentu juga memberikan `structuredContent` untuk konsumsi programatis, mengikuti skema Zod yang didefinisikan pada server.

## Keamanan

- Akses file dibatasi pada tipe teks tertentu dan dicegah keluar dari root repositori.
- Direktori sensitif seperti `node_modules` dan `.git` diabaikan secara eksplisit.

Selamat menggunakan MCP server ini untuk memperkaya alur kerja riset dan pengembangan Anda.
