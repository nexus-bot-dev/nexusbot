const os = require('os');
const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const crypto = require('crypto');
const { Telegraf, Scenes, session } = require('telegraf');

const app = express();
const axios = require('axios');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { 
    createssh, createvmess, createvless, createtrojan, createshadowsocks,
    trialssh, trialvmess, trialvless, trialtrojan
} = require('./modules/create');
const { renewssh, renewvmess, renewvless, renewtrojan, renewshadowsocks } = require('./modules/renew');

const fs = require('fs');
const vars = JSON.parse(fs.readFileSync('./.vars.json', 'utf8'));

// Menggunakan AUTSC_API_KEY baru
const AUTSC_API_KEY = vars.AUTSC_API_KEY;
const BOT_TOKEN = vars.BOT_TOKEN;
const port = vars.PORT || 50123;
const ADMIN = vars.USER_ID; 
const NAMA_STORE = vars.NAMA_STORE || '@NexusBot'; // Nama store diganti
const bot = new Telegraf(BOT_TOKEN);
const adminIds = ADMIN;
console.log('Bot initialized');

const db = new sqlite3.Database('./sellvpn.db', (err) => {
  if (err) {
    console.error('Kesalahan koneksi SQLite3:', err.message);
  } else {
    console.log('Terhubung ke SQLite3');
  }
});

db.run(`CREATE TABLE IF NOT EXISTS Server (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT,
  auth TEXT,
  harga INTEGER,
  nama_server TEXT,
  quota INTEGER,
  iplimit INTEGER,
  batas_create_akun INTEGER,
  total_create_akun INTEGER
)`, (err) => {
  if (err) {
    console.error('Kesalahan membuat tabel Server:', err.message);
  } else {
    console.log('Server table created or already exists');
  }
});

db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,
  saldo INTEGER DEFAULT 0,
  CONSTRAINT unique_user_id UNIQUE (user_id)
)`, (err) => {
  if (err) {
    console.error('Kesalahan membuat tabel users:', err.message);
  } else {
    console.log('Users table created or already exists');
  }
});

db.run(`CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id TEXT UNIQUE,
  user_id INTEGER,
  amount INTEGER,
  status TEXT
)`, (err) => {
  if (err) {
    console.error('Kesalahan membuat tabel transactions:', err.message);
  } else {
    console.log('Transactions table created or already exists');
  }
});

const userState = {};
global.depositState = {};
global.pendingDeposits = {}; // Menyimpan transaksi aktif
console.log('User state initialized');


bot.command(['start', 'menu'], async (ctx) => {
  console.log('Start or Menu command received');
  
  const userId = ctx.from.id;
  db.get('SELECT * FROM users WHERE user_id = ?', [userId], (err, row) => {
    if (err) {
      console.error('Kesalahan saat memeriksa user_id:', err.message);
      return;
    }

    if (row) {
      console.log(`User ID ${userId} sudah ada di database`);
    } else {
      db.run('INSERT INTO users (user_id) VALUES (?)', [userId], (err) => {
        if (err) {
          console.error('Kesalahan saat menyimpan user_id:', err.message);
        } else {
          console.log(`User ID ${userId} berhasil disimpan`);
        }
      });
    }
  });

  await sendMainMenu(ctx);
});

bot.command('admin', async (ctx) => {
  console.log('Admin menu requested');
  
  // Pastikan ADMIN adalah array string/number. Asumsi di sini adalah string/number.
  const adminList = Array.isArray(adminIds) ? adminIds : [adminIds]; 
  if (!adminList.includes(ctx.from.id.toString())) {
    await ctx.reply('🚫 Anda tidak memiliki izin untuk mengakses menu admin.');
    return;
  }

  await sendAdminMenu(ctx);
});

async function sendMainMenu(ctx) {
  const keyboard = [
    [
      { text: '➕ Buat Akun', callback_data: 'service_create' },
      { text: '♻️ Perpanjang Akun', callback_data: 'service_renew' }
    ],
    [
      { text: '✨ Trial Akun', callback_data: 'service_trial' } // TOMBOL BARU: Trial Akun
    ],
    [
      { text: '💰 TopUp Saldo', callback_data: 'topup_saldo' },
      { text: '💳 Cek Saldo', callback_data: 'cek_saldo' }
    ],
  ];

  const uptime = os.uptime();
  const days = Math.floor(uptime / (60 * 60 * 24));
  
  let jumlahServer = 0;
  try {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) AS count FROM Server', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    jumlahServer = row.count;
  } catch (err) {
    console.error('Kesalahan saat mengambil jumlah server:', err.message);
  }
  let jumlahPengguna = 0;
  try {
    const row = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) AS count FROM users', (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
    jumlahPengguna = row.count;
  } catch (err) {
    console.error('Kesalahan saat mengambil jumlah pengguna:', err.message);
  }

  const messageText = `*Selamat datang di ${NAMA_STORE},
Powered by FTVPN* 🚀
Bot VPN serba otomatis untuk membeli
layanan VPN dengan mudah dan cepat
Nikmati kemudahan dan kecepatan
dalam layanan VPN dengan bot kami!

⏳ *Uptime bot:* ${days} Hari
🌐 *Server tersedia:* ${jumlahServer}
👥 *Jumlah pengguna:* ${jumlahPengguna}

*Silakan pilih opsi layanan:*`;

  try {
    const replyOptions = {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: keyboard
        }
    };
    
    if (ctx.callbackQuery) {
         await ctx.editMessageText(messageText, replyOptions);
    } else {
         await ctx.reply(messageText, replyOptions);
    }
    console.log('Main menu sent');
  } catch (error) {
    if (error.response && error.response.error_code === 400) {
      // Jika pesan tidak dapat diedit, kirim pesan baru
      await ctx.reply(messageText, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: keyboard
        }
      });
      console.log('Main menu sent as new message');
    } else {
      console.error('Error saat mengirim menu utama:', error);
    }
  }
}

// ... (Fungsi-fungsi Admin lainnya) ...
// (Semua fungsi admin (addserver, editharga, dll.) dipertahankan seperti di versi sebelumnya)

// ... (Action Handlers untuk CREATE, RENEW, TRIAL) ...
// (Semua action handler dipertahankan seperti di versi sebelumnya)

// --- FUNGSI UTAMA BARU: PROSES DEPOSIT ---

async function processDeposit(ctx, amount) {
  const userId = ctx.from.id.toString();
  
  if (!AUTSC_API_KEY || AUTSC_API_KEY === 'ISIDISNI') {
      return ctx.reply('⚠️ *Gagal:* Kunci API (AUTSC_API_KEY) belum dikonfigurasi.', { parse_mode: 'Markdown' });
  }

  // Cek apakah ada transaksi pending
  const pendingTxn = await new Promise((resolve) => {
      db.get("SELECT transaction_id FROM transactions WHERE user_id = ? AND status = 'PENDING'", [userId], (err, row) => {
          resolve(row);
      });
  });

  if (pendingTxn) {
      // Jika ada, tawarkan untuk mengecek status transaksi yang sudah ada
      await ctx.reply('⚠️ *Anda memiliki transaksi Top Up yang tertunda.* Mohon selesaikan pembayaran sebelumnya atau batalkan.', {
          parse_mode: 'Markdown',
          reply_markup: {
              inline_keyboard: [
                  [{ text: '🔄 Cek Status Transaksi Lama', callback_data: `check_txn_${pendingTxn.transaction_id}` }],
                  [{ text: '❌ Batalkan Transaksi Lama', callback_data: `cancel_txn_${pendingTxn.transaction_id}` }]
              ]
          }
      });
      delete global.depositState[userId];
      return;
  }
  
  try {
    const apiUrl = `https://my-payment.autsc.my.id/api/deposit?amount=${amount}&apikey=${AUTSC_API_KEY}`;

    const response = await axios.get(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.data.status === "success") {
      const data = response.data.data;
      const transactionId = data.transaction_id;
      
      // Simpan transaksi di database sebagai PENDING
      db.run("INSERT INTO transactions (transaction_id, user_id, amount, status) VALUES (?, ?, ?, 'PENDING')", 
        [transactionId, userId, data.amount], (err) => {
          if (err) {
            console.error('Error saat menyimpan transaksi:', err.message);
            return ctx.reply('❌ *Terjadi kesalahan saat menyimpan transaksi.* Silakan coba lagi.', { parse_mode: 'Markdown' });
          }
        });
        
      // Simpan transaksi di memori global untuk callback
      global.pendingDeposits[transactionId] = { userId: userId, amount: data.amount };

      const expiredAt = new Date(data.expired_at).toLocaleString('id-ID', {
          day: 'numeric', month: 'long', year: 'numeric', 
          hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
      
      const message = `
💰 *DEPOSIT BERHASIL DIBUAT* 💰

┌─────────────────────
│ *Nominal* : Rp ${data.amount}
│ *Biaya Admin* : Rp ${data.fee}
│ *Total Bayar* : Rp ${data.total_amount}
└─────────────────────
📅 *Kadaluarsa*: ${expiredAt}

*Cara Pembayaran (QRIS):*
1. Simpan gambar QRIS di bawah.
2. Buka aplikasi E-wallet/M-banking Anda (Dana, GoPay, OVO, dll).
3. Pilih fitur Scan/Upload QRIS dan unggah gambar yang telah disimpan.
4. Pastikan nominal pembayaran adalah *Rp ${data.total_amount}*.

✨ *Scan QRIS di bawah ini:*
`;
      
      const buttons = [
          [{ text: '🔄 Cek Status Pembayaran', callback_data: `check_txn_${transactionId}` }],
          [{ text: '🔗 Lihat QRIS Langsung', url: data.qris_url }]
      ];
      
      await ctx.replyWithPhoto(data.qris_url, {
          caption: message,
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: buttons }
      });
      
      console.log(`✅ Permintaan deposit QRIS berhasil untuk user ${userId}, TXID: ${transactionId}`);
    } else {
      console.error('⚠️ Permintaan deposit gagal:', response.data.message);
      await ctx.reply(`⚠️ *Permintaan deposit gagal:* ${response.data.message}`, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('❌ Kesalahan saat mengirim permintaan deposit:', error);
    await ctx.reply('❌ *Terjadi kesalahan saat menghubungi server pembayaran. Silakan coba lagi nanti.*', { parse_mode: 'Markdown' });
  } finally {
    delete global.depositState[ctx.from.id];
  }
}

// --- FUNGSI BARU: CEK STATUS TRANSAKSI ---

async function checkTransactionStatus(ctx, transactionId) {
    if (!AUTSC_API_KEY || AUTSC_API_KEY === 'ISIDISNI') {
        return ctx.reply('⚠️ *Gagal:* Kunci API (AUTSC_API_KEY) belum dikonfigurasi.', { parse_mode: 'Markdown' });
    }
    
    try {
        const apiUrl = `https://my-payment.autsc.my.id/api/status/payment?transaction_id=${transactionId}&apikey=${AUTSC_API_KEY}`;
        
        const response = await axios.get(apiUrl, {
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.status === 200) {
            const data = response.data;
            const isPaid = data.paid;
            
            if (isPaid) {
                // Ambil detail dari database lokal
                db.get("SELECT * FROM transactions WHERE transaction_id = ?", [transactionId], async (err, txn) => {
                    if (err || !txn) {
                        console.error("Error fetching txn local details or txn not found:", err);
                        // Lakukan update saldo langsung jika detail lokal hilang
                        await updateBalanceAndNotify(ctx, ctx.from.id.toString(), transactionId, 'API Success');
                        return;
                    }
                    
                    if (txn.status === 'PENDING') {
                        // Update saldo dan status
                        await updateBalanceAndNotify(ctx, txn.user_id, transactionId, 'API Success');
                        await ctx.editMessageText(`✅ *Pembayaran berhasil dikonfirmasi!* Saldo Anda telah ditambahkan.`, { parse_mode: 'Markdown' });
                    } else {
                        await ctx.editMessageText(`✅ *Pembayaran sudah dikonfirmasi sebelumnya.* Saldo sudah ditambahkan.`, { parse_mode: 'Markdown' });
                    }
                });
            } else {
                await ctx.answerCbQuery('⏳ Pembayaran belum diterima. Silakan coba lagi sebentar.', { show_alert: true });
            }
        } else {
            await ctx.answerCbQuery('❌ Gagal memeriksa status. Server pembayaran bermasalah.', { show_alert: true });
        }
        
    } catch (error) {
        console.error('Error saat cek status transaksi:', error.message);
        await ctx.reply('❌ *Terjadi kesalahan saat memeriksa status pembayaran.*', { parse_mode: 'Markdown' });
    }
}

// --- FUNGSI UNTUK MENGURANGI SALDO DAN NOTIFIKASI ---
async function updateBalanceAndNotify(ctx, userId, transactionId, status) {
    // 1. Ambil detail transaksi (asumsi sudah ada)
    const txn = await new Promise((resolve) => {
        db.get("SELECT amount FROM transactions WHERE transaction_id = ?", [transactionId], (err, row) => {
            resolve(row);
        });
    });

    if (!txn) {
        console.error(`Tidak dapat menemukan transaksi ${transactionId} untuk update saldo.`);
        return;
    }
    
    const amount = txn.amount;

    // 2. Update saldo pengguna & status transaksi
    await new Promise((resolve) => {
        db.run("UPDATE users SET saldo = saldo + ? WHERE user_id = ?", [amount, userId], (err) => {
            if (err) console.error("Error updating user balance:", err);
            db.run("UPDATE transactions SET status = ? WHERE transaction_id = ?", [status, transactionId], (err) => {
                if (err) console.error("Error updating transaction status:", err);
                resolve();
            });
        });
    });

    // 3. Ambil saldo baru dan kirim notifikasi
    const userRow = await new Promise((resolve) => {
        db.get("SELECT saldo FROM users WHERE user_id = ?", [userId], (err, row) => {
            resolve(row);
        });
    });

    const newSaldo = userRow ? userRow.saldo : 'N/A';
    const message = `✅ *Deposit berhasil DITERIMA!*
💰 Jumlah: Rp ${amount}
💵 Saldo sekarang: Rp ${newSaldo}`;
    
    // Kirim notifikasi ke user via Telegram
    bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' }).catch(e => console.error('Gagal kirim notif saldo:', e.message));
}


// --- API CALLBACK ENDPOINT ---
app.post('/callback/autsc', async (req, res) => {
  console.log('AUTSC Callback received:', req.body);
  const { transaction_id, status } = req.body;

  if (!transaction_id || status !== 'Success') {
      console.log(`Callback ignored or failed. TXID: ${transaction_id}, Status: ${status}`);
      return res.status(200).send('Ignored');
  }

  // Cek apakah transaksi sudah diproses
  db.get("SELECT * FROM transactions WHERE transaction_id = ?", [transaction_id], async (err, txn) => {
      if (err) {
          console.error("DB Error on callback check:", err);
          return res.status(500).send('Server Error');
      }

      if (!txn) {
          console.warn(`Transaction ID ${transaction_id} not found locally.`);
          // Masih kirim success ke API agar tidak retry terus
          return res.status(200).send('Success, but Txn not found locally'); 
      }
      
      if (txn.status === 'PENDING') {
          // Proses update saldo
          await updateBalanceAndNotify(null, txn.user_id, transaction_id, 'Callback Success');
          delete global.pendingDeposits[transaction_id];
          console.log(`✅ Saldo berhasil diperbarui via callback untuk user_id: ${txn.user_id}`);
          return res.status(200).send('Success');
      } else {
          console.log(`Transaksi ${transaction_id} sudah diproses.`);
          return res.status(200).send('Already Processed');
      }
  });
});


// ... (Action Handlers lainnya dipertahankan) ...

bot.action('topup_saldo', async (ctx) => {
  try {
    await ctx.answerCbQuery(); 
    const userId = ctx.from.id;
    console.log(`🔍 User ${userId} memulai proses top-up saldo.`);
    

    if (!global.depositState) {
      global.depositState = {};
    }
    global.depositState[userId] = { action: 'request_amount', amount: '' };
    
    console.log(`🔍 User ${userId} diminta untuk memasukkan jumlah nominal saldo.`);
    

    const keyboard = keyboard_nomor();
    
    await ctx.reply('💰 *Silakan masukkan jumlah nominal saldo (minimal Rp 100) yang Anda ingin tambahkan ke akun Anda:*', {
      reply_markup: {
        inline_keyboard: keyboard
      },
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('❌ Kesalahan saat memulai proses top-up saldo:', error);
    await ctx.reply('❌ *GAGAL! Terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi nanti.*', { parse_mode: 'Markdown' });
  }
});

// Aksi untuk memeriksa status transaksi
bot.action(/check_txn_(.+)/, async (ctx) => {
    const transactionId = ctx.match[1];
    await ctx.answerCbQuery('Sedang memeriksa status pembayaran...');
    await checkTransactionStatus(ctx, transactionId);
});

// Aksi untuk membatalkan transaksi pending
bot.action(/cancel_txn_(.+)/, async (ctx) => {
    const transactionId = ctx.match[1];
    await new Promise((resolve) => {
        db.run("DELETE FROM transactions WHERE transaction_id = ? AND user_id = ?", [transactionId, ctx.from.id.toString()], (err) => {
            if (err) console.error("Error deleting transaction:", err);
            delete global.pendingDeposits[transactionId];
            resolve();
        });
    });
    await ctx.editMessageText('❌ *Transaksi dibatalkan.* Anda dapat membuat permintaan top up baru sekarang.', { parse_mode: 'Markdown' });
});

// ... (Fungsi keyboard_abc, keyboard_nomor, keyboard_full dipertahankan) ...

function keyboard_abc() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  const buttons = [];
  for (let i = 0; i < alphabet.length; i += 3) {
    const row = alphabet.slice(i, i + 3).split('').map(char => ({
      text: char,
      callback_data: char
    }));
    buttons.push(row);
  }
  buttons.push([{ text: '🔙 Hapus', callback_data: 'delete' }, { text: '✅ Konfirmasi', callback_data: 'confirm' }]);
  buttons.push([{ text: '🔙 Kembali ke Menu Utama', callback_data: 'send_main_menu' }]);
  return buttons;
}

function keyboard_nomor() {
  const alphabet = '1234567890';
  const buttons = [];
  for (let i = 0; i < alphabet.length; i += 3) {
    const row = alphabet.slice(i, i + 3).split('').map(char => ({
      text: char,
      callback_data: char
    }));
    buttons.push(row);
  }
  buttons.push([{ text: '🔙 Hapus', callback_data: 'delete' }, { text: '✅ Konfirmasi', callback_data: 'confirm' }]);
  buttons.push([{ text: '🔙 Kembali ke Menu Utama', callback_data: 'send_main_menu' }]);
  return buttons;
}

function keyboard_full() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const buttons = [];
  for (let i = 0; i < alphabet.length; i += 3) {
    const row = alphabet.slice(i, i + 3).split('').map(char => ({
      text: char,
      callback_data: char
    }));
    buttons.push(row);
  }
  buttons.push([{ text: '.', callback_data: '.' }, { text: '-', callback_data: '-' }, { text: '🔙 Hapus', callback_data: 'delete' }, { text: '✅ Konfirmasi', callback_data: 'confirm' }]);
  buttons.push([{ text: '🔙 Kembali ke Menu Utama', callback_data: 'send_main_menu' }]);
  return buttons;
}

// ... (Sisanya dari app.js, termasuk fungsi handler topup lama yang dimodifikasi) ...
async function handleDepositState(ctx, userId, data) {
  let currentAmount = global.depositState[userId].amount;

  if (data === 'delete') {
    currentAmount = currentAmount.slice(0, -1);
  } else if (data === 'confirm') {
    if (currentAmount.length === 0) {
      return await ctx.answerCbQuery('⚠️ Jumlah tidak boleh kosong!', { show_alert: true });
    }
    // Minimal 100 perak
    if (parseInt(currentAmount) < 100) {
      return await ctx.answerCbQuery('⚠️ Jumlah minimal adalah 100 perak!', { show_alert: true });
    }
    global.depositState[userId].action = 'confirm_amount';
    await processDeposit(ctx, currentAmount);
    return;
  } else {
    if (!/^[0-9]+$/.test(data)) {
      return await ctx.answerCbQuery('⚠️ Hanya angka yang diperbolehkan!', { show_alert: true });
    }
    if (currentAmount.length < 12) {
      currentAmount += data;
    } else {
      return await ctx.answerCbQuery('⚠️ Jumlah maksimal adalah 12 digit!', { show_alert: true });
    }
  }

  global.depositState[userId].amount = currentAmount;
  const newMessage = `💰 *Silakan masukkan jumlah nominal saldo (minimal Rp 100) yang Anda ingin tambahkan ke akun Anda:*\n\nJumlah saat ini: *Rp ${currentAmount}*`;
  if (newMessage !== ctx.callbackQuery.message.text) {
    await ctx.editMessageText(newMessage, {
      reply_markup: { inline_keyboard: keyboard_nomor() },
      parse_mode: 'Markdown'
    });
  }
}
// ... (Sisa fungsi handle lainnya) ...

bot.launch().then(() => {
    console.log('Bot telah dimulai');
}).catch((error) => {
    console.error('Error saat memulai bot:', error);
});

app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
});
