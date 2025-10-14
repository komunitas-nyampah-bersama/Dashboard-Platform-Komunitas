# Integrasi Dashboard WhatsApp Melalui Telegram TechCommunity

Dokumen ini memberikan panduan praktis untuk memanfaatkan komunitas Telegram [TechCommunity](https://t.me/techcommunity) sebagai antarmuka koordinasi yang mengarahkan alur otomasi WhatsApp pada Dashboard GPT yang terhubung dengan backend Python Anda melalui Zapier MCP.

## 1. Arsitektur Alur

1. **Input Komunitas**: Admin atau kontributor menyampaikan permintaan di grup Telegram (mis. pengumuman kampanye, broadcast, atau tindak lanjut anggota).
2. **Bot Telegram**: Bot memantau pesan tertentu (menggunakan perintah atau tag). Bot meneruskan data ke Zapier melalui webhook.
3. **Zapier MCP + GPT**: Zapier menjalankan _Zap_ yang memanggil konektor MCP GPT. GPT menerima konteks (permintaan broadcast, segmen anggota, dsb.) dan mengembalikan instruksi terstruktur.
4. **Backend Python**: Langkah _Code by Zapier (Python)_ memanggil skrip Anda untuk mengambil data komunitas (anggota, channel, statistik) dan merangkai payload yang siap dikirim.
5. **WhatsApp Business API**: Zapier menyalurkan payload ke penyedia resmi (Twilio/360dialog/Zenvia). Pesan otomatis dikirim ke kontak atau grup yang diotorisasi.
6. **Logging & Analytics**: Hasil kirim dikembalikan ke backend untuk dicatat pada modul analitik dashboard.

## 2. Konfigurasi Telegram Bot

1. **Buat bot** melalui [@BotFather](https://t.me/BotFather) dan catat token API.
2. **Tambahkan bot** ke grup TechCommunity dan berikan hak `can_read_all_group_messages` jika ingin memantau semua pesan.
3. **Gunakan webhook**: Deploy endpoint (mis. menggunakan Cloud Functions) yang menerima `POST` dari Telegram dan meneruskan ke Zapier (via `hooks.zapier.com`). Pastikan melakukan verifikasi token untuk keamanan.
4. **Definisikan format perintah**, misalnya `!wa broadcast <segment> <pesan>` atau `!wa report <rentang_waktu>`. Format ini memudahkan parsing pada Zapier.

## 3. Rancangan Zapier

| Langkah | Deskripsi | Catatan |
| --- | --- | --- |
| **Trigger** | Webhooks by Zapier (Catch Hook) menerima payload dari bot Telegram. | Pastikan payload memuat ID pesan, user, dan teks. |
| **Filter** | Validasi perintah (mis. hanya perintah yang diawali `!wa`). | Menghindari pemicu tak sengaja. |
| **Formatter** | Pisahkan parameter (segment, pesan, dsb.). | Bisa memakai `Text > Split` atau `Utilities > Line Itemizer`. |
| **GPT (MCP Connector)** | Kirim konteks komunitas + perintah. GPT merumuskan langkah terstruktur (contoh: target, template pesan, CTA). | Simpan output JSON agar mudah dipakai oleh Python. |
| **Python Code** | Jalankan skrip backend Anda untuk mengambil data anggota/channel, serta menyusun payload final. | Output: daftar penerima, pesan siap kirim, metadata. |
| **WhatsApp Action** | Gunakan integrasi resmi (Twilio/360dialog/Zenvia) untuk mengirim pesan. | Pastikan template disetujui Meta untuk _session message_. |
| **Logging** | Kirim hasil ke endpoint backend (mis. `POST /logs/automation`). | Untuk memperbarui analitik dashboard. |

## 4. Pemanfaatan Data Backend

Backend Python Anda sudah menyiapkan berbagai dataset (status sistem, grup/channel, analytics, log aktivitas). Gunakan output tersebut untuk:

- **Segmentasi**: Menentukan penerima berdasar peran/aktivitas.
- **Kustomisasi Pesan**: Sisipkan statistik terbaru (mis. jumlah kontribusi, progress kampanye).
- **Monitoring**: Menulis ulang hasil kirim ke modul analitik sehingga dashboard GPT menampilkan performa broadcast.
- **Ekspor**: Otomatisasi ekspor CSV/JSON untuk laporan berkala ke Google Sheets atau penyimpanan cloud lainnya.

## 5. Best Practices

- **Keamanan**: Simpan token bot dan kredensial API sebagai _environment variable_ di Zapier. Batasi perintah yang boleh dijalankan melalui daftar admin.
- **Audit Trail**: Setiap perintah dari Telegram disertai ID pengguna agar mudah ditelusuri.
- **Skalabilitas**: Untuk volume besar, pertimbangkan antrean (mis. AWS SQS) di antara Python dan WhatsApp API.
- **Kepatuhan WhatsApp**: Gunakan template yang telah disetujui, sertakan opsi berhenti berlangganan, dan patuhi regulasi privasi.
- **Uji Coba Bertahap**: Mulai dari segmen kecil sebelum mengaktifkan broadcast massal.

## 6. Integrasi ke Dashboard GPT

1. **Widget Status**: Tampilkan status webhook Telegram, antrian Zapier, dan kesehatan API WhatsApp.
2. **Kontrol Otomasi**: Sediakan tombol untuk menonaktifkan sementara Zap (dengan memanggil API Zapier) langsung dari dashboard.
3. **Riwayat Kampanye**: Render log dari backend Python (waktu kirim, target, metrik keterbacaan) agar tim bisa mengevaluasi performa.
4. **Pengaturan Segmentasi**: Sediakan form untuk memperbarui parameter segmentasi yang dibaca oleh skrip Python ketika Zap berjalan.

Dengan alur ini, komunitas TechCommunity di Telegram berfungsi sebagai _command center_ ringan yang memicu otomasi WhatsApp, sementara dashboard GPT Anda menjadi _single source of truth_ untuk monitoring dan penyesuaian strategi komunikasi.

## 7. Memahami Notifikasi "Work Alert – New Message"

Pesan seperti **“Work Alert - New Message 📬 New message from Safwa - Community Manager. Reply now at: https://t.me/techcommunity”** adalah notifikasi yang dikirimkan bot Telegram ke kanal operasional Anda. Fungsi utamanya adalah:

- **Memberi tahu admin** bahwa ada instruksi atau pertanyaan baru di grup TechCommunity yang perlu ditangani.
- **Menjaga SLA respon**. Dengan membuka tautan, admin langsung diarahkan ke percakapan Telegram untuk meninjau konteks lengkapnya sebelum memicu otomasi WhatsApp.
- **Mencegah otomasi yang salah sasaran**. Notifikasi bertindak sebagai _gatekeeper_ sehingga hanya permintaan yang valid (misalnya broadcast terjadwal atau follow-up anggota) yang diteruskan ke Zapier.

### Cara Menggunakan Notifikasi

1. **Buka tautan Telegram** untuk membaca pesan asli dari Safwa atau anggota lain. Pastikan memahami detail konteksnya (jenis kampanye, target audiens, urgensi).
2. **Gunakan perintah bot** yang sesuai jika otomasi perlu dijalankan, misalnya `!wa broadcast alumni "Pesan"` langsung di grup Telegram.
3. **Validasi data** di dashboard GPT sebelum menjalankan otomasi besar. Cek widget status Zapier, antrian WhatsApp, dan segmentasi yang akan digunakan.
4. **Eksekusi atau tunda**. Jika pesan membutuhkan tindak lanjut manual, catat respons di dashboard atau gunakan fitur _snooze_ pada Zapier/Telegram bot agar tim lain mengetahui statusnya.

> **Tip:** Jika Anda sering menerima notifikasi yang tidak relevan, perbarui aturan pemicu bot (mis. filter berdasarkan kata kunci atau role pengirim) sehingga hanya pesan penting yang memunculkan “Work Alert”.
