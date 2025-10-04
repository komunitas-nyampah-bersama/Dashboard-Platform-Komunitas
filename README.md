# Dashboard Platform Komunitas Nyampah Bersama 2BCycle

Platform berbasis blockchain untuk komunitas riset desentralisasi yang mengintegrasikan PoAV, 2BCycle, dan ekonomi sirkular untuk menciptakan perubahan lingkungan yang berkelanjutan.

## Antarmuka Next.js untuk GPT Kustom

Repositori ini kini juga menyertakan aplikasi **Next.js** yang berfungsi sebagai penghubung antara Supabase dan OpenAI Responses API untuk menjalankan GPT kustom.

### Konfigurasi Lingkungan

Salin file `.env.local.example` menjadi `.env.local` lalu isi dengan kredensial yang sesuai:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY="your-anon-key"
OPENAI_API_KEY="sk-proj-************************************"
# OPENAI_MODEL="gpt-5-nano"
```

> **Peringatan:** Jangan commit kunci rahasia Anda ke repositori publik.

Jika variabel Supabase belum diisi, halaman utama akan menampilkan peringatan pada panel "Supabase Todos" dan tidak akan mencoba melakukan koneksi. Pastikan juga tabel `todos` tersedia pada proyek Supabase Anda (minimal berisi kolom `id` dan salah satu dari `title`, `task`, atau `description`) agar daftar percakapan sinkron dengan data backend.

### Menjalankan Aplikasi

```bash
npm install
npm run dev
```

Aplikasi akan berjalan pada `http://localhost:3000` dengan fitur berikut:

- Panel percakapan untuk mengirim prompt ke GPT kustom via endpoint `/api/chat`.
- Pengambilan data contoh dari Supabase (tabel `todos`) langsung dari Server Component.
- Middleware Supabase untuk memastikan sesi tetap sinkron antara server dan klien.

Antarmuka baru ini dapat dikembangkan lebih lanjut untuk menyimpan riwayat percakapan atau mengelola preset prompt langsung dari Supabase.

### Status Backend & Langkah Sebelum Deploy

- **Arsitektur full-stack berbasis Next.js.** Folder `app/api/chat/route.ts` bertindak sebagai backend serverless yang meneruskan permintaan pengguna ke OpenAI Responses API serta memproses riwayat percakapan sebelum mengembalikan jawaban ke frontend.【F:app/api/chat/route.ts†L1-L90】
- **Pengaya data melalui Supabase.** Komponen server pada `app/page.tsx` mengambil data dari tabel `todos` untuk mengisi sidebar dan menampilkan pesan kesalahan jika kredensial tidak tersedia, sehingga jelas kapan integrasi backend telah aktif.【F:app/page.tsx†L1-L126】
- **Belum menyimpan riwayat ke database.** Endpoint hanya meneruskan prompt dan tidak melakukan penyimpanan atau manajemen sesi lanjutan; tambahkan layanan penyimpanan (mis. tabel baru di Supabase) bila dibutuhkan.
- **Konfigurasi environment wajib.** Pastikan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`, dan `OPENAI_API_KEY` terset sebelum build/ deploy agar middleware, API route, dan fetch data berjalan baik.【F:README.md†L12-L33】
- **Uji lokal sebelum produksi.** Jalankan `npm run lint` dan `npm run build` untuk memastikan kode siap produksi, kemudian pilih target deploy (mis. Vercel, Netlify, atau penyedia Node lainnya) yang mendukung Next.js edge/serverless.

### Langkah Pengembangan Setelah Ini

1. **Lengkapi skema Supabase untuk percakapan.** Buat tabel baru (mis. `conversations` dan `messages`) agar setiap permintaan ke `/api/chat` dapat disimpan beserta metadata pengguna. Gunakan kebijakan RLS supaya hanya pemilik akun yang dapat membaca riwayatnya.
2. **Integrasikan autentikasi Supabase.** Aktifkan provider (email, magic link, OAuth) lalu gunakan `@supabase/ssr` untuk menjaga sesi pada middleware dan komponen server sehingga panel percakapan memuat data khusus pengguna.
3. **Sinkronkan riwayat obrolan di frontend.** Perluas `ChatPanel` untuk mengambil riwayat dari Supabase ketika halaman dimuat dan perbarui tampilan secara optimistis setiap kali respons baru datang dari OpenAI.
4. **Tambahkan kuota dan observabilitas.** Implementasikan pembatasan laju (rate limiting) pada API route, log setiap request ke alat observability (mis. Logflare, Supabase Log, atau Vercel Analytics), dan siapkan alert ketika error meningkat.
5. **Siapkan pipeline CI/CD.** Gunakan GitHub Actions atau Vercel Deploy Hooks untuk menjalankan `npm run lint` dan `npm run build` di setiap commit utama, sehingga status kesiapan selalu terpantau sebelum rilis produksi.
6. **Uji coba dengan pengguna internal.** Jalankan sesi beta terbatas, kumpulkan masukan mengenai UI, kecepatan respons, dan stabilitas koneksi Supabase-OpenAI; iterasikan berdasarkan temuan tersebut sebelum peluncuran publik.

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

## Cara Menjalankan Proyek

1. Clone repositori ini:
```bash
git clone https://github.com/komunitas-nyampah-bersama/Dashboard-Platform-Komunitas.git


## Lisensi

Proyek ini dilisensikan di bawah [MIT License](LICENSE).
