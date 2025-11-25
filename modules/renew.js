const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sellvpn.db');

// Catatan: Fungsi renew hanya memerlukan username (num) dan exp.

async function renewssh(username, exp, serverId) {
  console.log(`Renewing SSH account for ${username}...`);
  
  if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
    return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
  }

  return new Promise((resolve) => {
    db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
      if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

      const domain = server.domain;
      const auth = server.auth;
      // Menggunakan port 6969
      const param = `:6969/rensh?num=${username}&exp=${exp}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      axios.get(url)
        .then(response => {
          if (response.data.status === "success") {
            const sshData = response.data.data;
            const msg = `
🌟 *RENEW SSH PREMIUM* 🌟

🔹 *Informasi Akun*
┌─────────────────────────────
│ Username: \`${username}\`
│ Kadaluarsa: \`${sshData.exp}\`
│ Batas IP: \`${sshData.limitip} IP\`
└─────────────────────────────
✅ Akun ${username} berhasil diperbarui.
✨ Selamat menggunakan layanan kami! ✨
`;
              return resolve(msg);
            } else {
              return resolve(`❌ Terjadi kesalahan: ${response.data.message}`);
            }
          })
        .catch(error => {
          console.error('Error saat memperbarui SSH:', error.message);
          return resolve('❌ Terjadi kesalahan saat memperbarui SSH. Silakan coba lagi nanti.');
        });
    });
  });
}
async function renewvmess(username, exp, serverId) {
    console.log(`Renewing VMess account for ${username}...`);
    
    if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
      return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
    }
  
    return new Promise((resolve) => {
      db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
        if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');
  
        const domain = server.domain;
        const auth = server.auth;
        // Menggunakan port 6969
        const param = `:6969/renws?num=${username}&exp=${exp}&auth=${auth}`;
        const url = `http://${domain}${param}`;
        axios.get(url)
          .then(response => {
            if (response.data.status === "success") {
              const vmessData = response.data.data;
              const msg = `
  🌟 *RENEW VMESS PREMIUM* 🌟
  
  🔹 *Informasi Akun*
  ┌─────────────────────────────
  │ Username: \`${username}\`
  │ Kadaluarsa: \`${vmessData.exp}\`
  │ Kuota: \`${vmessData.quota}\`
  │ Batas IP: \`${vmessData.limitip} IP\`
  └─────────────────────────────
  ✅ Akun ${username} berhasil diperbarui.
  ✨ Selamat menggunakan layanan kami! ✨
  `;
                return resolve(msg);
              } else {
                return resolve(`❌ Terjadi kesalahan: ${response.data.message}`);
              }
            })
          .catch(error => {
            console.error('Error saat memperbarui VMess:', error.message);
            return resolve('❌ Terjadi kesalahan saat memperbarui VMess. Silakan coba lagi nanti.');
          });
      });
    });
  }
  async function renewvless(username, exp, serverId) {
    console.log(`Renewing VLESS account for ${username}...`);
    
    if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
      return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
    }
  
    return new Promise((resolve) => {
      db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
        if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');
  
        const domain = server.domain;
        const auth = server.auth;
        // Menggunakan port 6969
        const param = `:6969/renvl?num=${username}&exp=${exp}&auth=${auth}`;
        const url = `http://${domain}${param}`;
        axios.get(url)
          .then(response => {
            if (response.data.status === "success") {
              const vlessData = response.data.data;
              const msg = `
  🌟 *RENEW VLESS PREMIUM* 🌟
  
  🔹 *Informasi Akun*
  ┌─────────────────────────────
  │ Username: \`${username}\`
  │ Kadaluarsa: \`${vlessData.exp}\`
  │ Kuota: \`${vlessData.quota}\`
  │ Batas IP: \`${vlessData.limitip} IP\`
  └─────────────────────────────
  ✅ Akun ${username} berhasil diperbarui.
  ✨ Selamat menggunakan layanan kami! ✨
  `;
                return resolve(msg);
              } else {
                return resolve(`❌ Terjadi kesalahan: ${response.data.message}`);
              }
            })
          .catch(error => {
            console.error('Error saat memperbarui VLESS:', error.message);
            return resolve('❌ Terjadi kesalahan saat memperbarui VLESS. Silakan coba lagi nanti.');
          });
      });
    });
  }
  async function renewtrojan(username, exp, serverId) {
    console.log(`Renewing Trojan account for ${username}...`);
    
    if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
      return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
    }
  
    return new Promise((resolve) => {
      db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
        if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');
  
        const domain = server.domain;
        const auth = server.auth;
        // Menggunakan port 6969
        const param = `:6969/rentr?num=${username}&exp=${exp}&auth=${auth}`;
        const url = `http://${domain}${param}`;
        axios.get(url)
          .then(response => {
            if (response.data.status === "success") {
              const trojanData = response.data.data;
              const msg = `
  🌟 *RENEW TROJAN PREMIUM* 🌟
  
  🔹 *Informasi Akun*
  ┌─────────────────────────────
  │ Username: \`${username}\`
  │ Kadaluarsa: \`${trojanData.exp}\`
  │ Kuota: \`${trojanData.quota}\`
  │ Batas IP: \`${trojanData.limitip} IP\`
  └─────────────────────────────
  ✅ Akun ${username} berhasil diperbarui.
  ✨ Selamat menggunakan layanan kami! ✨
  `;
                return resolve(msg);
              } else {
                return resolve(`❌ Terjadi kesalahan: ${response.data.message}`);
              }
            })
          .catch(error => {
            console.error('Error saat memperbarui Trojan:', error.message);
            return resolve('❌ Terjadi kesalahan saat memperbarui Trojan. Silakan coba lagi nanti.');
          });
      });
    });
  }
  
  // Fungsi renewshadowsocks dihapus total
  
  module.exports = { renewtrojan, renewvless, renewvmess, renewssh };
