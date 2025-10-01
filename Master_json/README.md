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
