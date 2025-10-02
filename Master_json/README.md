# Abang Oky ORCID Custom GPT Action

Dokumen ini menjelaskan bagaimana konfigurasi `gpt_custom_action_schema.json` bekerja ketika digunakan di Custom GPT milik Abang Oky.

## Alur Eksekusi
1. **Inisiasi Aksi** – GPT akan memilih aksi "Abang Oky ORCID Scholar" ketika membutuhkan data profil publik peneliti.
2. **Permintaan OAuth** – GPT mengarahkan pengguna ke `https://orcid.org/oauth/authorize` menggunakan Client ID aplikasi Abang Oky. Setelah pengguna login dan menyetujui cakupan `/read-public`, ORCID mengembalikan kode otorisasi ke salah satu URI pengalihan yang terdaftar (mis. `https://chatgpt.com/g/g-68d5b9c669c08191a513e9d75bc85c4e-abang-oky-ai`).
3. **Penukaran Token** – GPT menukar kode otorisasi tersebut ke `https://orcid.org/oauth/token` untuk mendapatkan `access_token` yang valid beserta ORCID iD pengguna.
4. **Pemanggilan API** – Dengan token itu, GPT memanggil endpoint `GET /{orcid_id}/record` pada `https://pub.orcid.org/v3.0` untuk mengambil data publik ORCID dalam format JSON.
5. **Pengolahan Jawaban** – GPT membaca struktur respons (seperti nama, biografi, dan ringkasan aktivitas) lalu merangkumnya agar sesuai dengan konteks bimbingan akademik yang diminta pengguna.

## Fungsi yang Disediakan
- **`getOrcidProfile`**: Mengambil profil publik lengkap untuk satu ORCID iD. Endpoint ini berada di bagian `paths` file manifest dan membutuhkan parameter `orcid_id` berbentuk `0000-0000-0000-0000`.

## Hal yang Perlu Disiapkan
- Pastikan Client ID dan Client Secret yang diberikan ORCID tersimpan di konfigurasi Custom GPT ketika menautkan aksi.
- Semua URI pengalihan yang akan digunakan sudah terdaftar di dashboard ORCID agar proses login berhasil.
- Logo, URL legal, dan kebijakan privasi pada manifest mengarah ke halaman publik GPT yang sama sehingga memenuhi persyaratan Custom GPT.

Dengan alur di atas, GPT dapat memanfaatkan data ORCID resmi untuk membantu bimbingan akademik tanpa harus menangani data sensitif secara langsung.

## Cara Menghubungkan ke Custom GPT
Ikuti langkah berikut agar manifest dapat digunakan langsung di aksi Custom GPT Anda:

1. **Unggah Manifest** – Pada halaman pengaturan Custom GPT, pilih tab *Actions* lalu klik *Import from URL/Upload*. Seret file `gpt_custom_action_schema.json` ini atau unggah melalui GitHub Raw sehingga struktur OAuth dan OpenAPI terbaca otomatis.
2. **Isi Kredensial OAuth** – Masukkan `Client ID` dan `Client Secret` ORCID yang aktif (sandbox atau produksi). Pastikan nilai tersebut sama dengan yang terdaftar pada dashboard ORCID aplikasi Anda.
3. **Tetapkan Redirect URI** – Gunakan salah satu URI pengalihan yang sudah didaftarkan di ORCID (mis. `https://chatgpt.com/g/g-68d5b9c669c08191a513e9d75bc85c4e-abang-oky-ai`). URI inilah yang harus dimasukkan saat konfigurasi aksi Custom GPT.
4. **Simpan dan Uji** – Setelah semua bidang terisi, klik *Save* dan jalankan percakapan percobaan. Jika proses OAuth berhasil, GPT akan dapat memicu fungsi `getOrcidProfile` dan menampilkan ringkasan profil ORCID pengguna.

## Panduan Pengujian
Gunakan langkah berikut untuk memastikan konfigurasi bekerja sebelum dipasang ke Custom GPT produksi:

1. **Validasi Manifest**  
   Jalankan perintah berikut di repositori ini untuk memastikan file JSON valid:
   ```bash
   jq empty Master_json/gpt_custom_action_schema.json
   ```

2. **Uji Alur OAuth di Sandbox**  
   a. Buka URL otorisasi dan ganti `REDIRECT_URI` sesuai yang terdaftar di dashboard ORCID:  
   `https://sandbox.orcid.org/oauth/authorize?client_id=APP-XXXXX&response_type=code&scope=/read-public&redirect_uri=REDIRECT_URI`

   b. Setelah login, ORCID akan mengarahkan ke URI pengalihan sambil membawa parameter `code`. Simpan nilai tersebut.

   c. Tukarkan `code` menjadi `access_token` menggunakan `curl` berikut (ganti placeholder sesuai kredensial sandbox Anda):
   ```bash
   curl -i -L -H "Accept: application/json" \
     --data "client_id=APP-XXXXX" \
     --data "client_secret=CLIENT_SECRET" \
     --data "grant_type=authorization_code" \
     --data "redirect_uri=REDIRECT_URI" \
     --data "code=AUTH_CODE" \
     https://sandbox.orcid.org/oauth/token
   ```

3. **Verifikasi Endpoint ORCID**  
   Ambil profil publik menggunakan token yang diterima pada langkah sebelumnya:
   ```bash
   curl -H "Accept: application/json" \
     -H "Authorization: Bearer ACCESS_TOKEN" \
     https://pub.sandbox.orcid.org/v3.0/0000-0000-0000-0000/record
   ```

4. **Konfirmasi di Custom GPT**  
   Setelah tes sandbox berhasil, masukkan Client ID, Client Secret, dan URI pengalihan produksi ke pengaturan aksi Custom GPT, lalu lakukan percakapan percobaan untuk memastikan GPT dapat memicu aksi dan merangkum data ORCID yang diambil.
