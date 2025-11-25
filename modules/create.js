const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./sellvpn.db');

// --- Helper Function untuk Memformat Pesan Respons ---
function formatVpnResponse(data, type) {
    let msg, buttons;
    const username = data.username || data.user;
    
    if (type === 'ssh') {
        msg = `
🌟 *AKUN SSH PREMIUM* 🌟

🔹 *Informasi Akun*
┌─────────────────────
│ *Username* : \`${data.username}\`
│ *Password* : \`${data.password}\`
│ *Expired* : \`${data.expired}\`
└─────────────────────
┌─────────────────────
│ *Domain/IP*: \`${data.host || data.ip}\`
│ *Dropbear* : \`${data.ports.dropbearWS || '143, 109'}\`
│ *SSH WS* : \`${data.ports.sshWS || '80, 8080'}\`
│ *SSH SSL* : \`${data.ports.sshWSSSL || '443'}\`
│ *OVPN* : \`${data.ports.ovpnSSL || '443'}\`
└─────────────────────
`;
        buttons = [
            [{ text: '🔗 Save Account Link', url: data.saveLink }],
            [{ text: '📥 OpenVPN Config', url: data.ovpnDownload }],
        ];
    } else {
        const quotaText = data.quota ? 
            (data.quota === '0 GB' || data.quota === 'Unlimited' ? 'Unlimited' : data.quota) : 
            (data.quota_usage ? `${data.quota_usage} / ${data.quota_limit} GB` : 'N/A');
        
        const type_name = type.toUpperCase();
        
        msg = `
🌟 *AKUN ${type_name} PREMIUM* 🌟

🔹 *Informasi Akun*
┌─────────────────────
│ *Username* : \`${username}\`
│ *UUID* : \`${data.uuid}\`
│ *Expired* : \`${data.expired}\`
└─────────────────────
┌─────────────────────
│ *Domain* : \`${data.domain}\`
│ *Port TLS* : \`443\`
│ *Port HTTP*: \`80\`
│ *Quota* : \`${quotaText}\`
└─────────────────────

🔐 *URL TLS (WS)*
\`\`\`
${data.ws_tls || data.ws}
\`\`\`
🔓 *URL Non-TLS (WS)*
\`\`\`
${data.ws_none_tls || data.grpc}
\`\`\`
`;
        buttons = [
            [{ text: '🔗 OpenClash Config', url: data.openclash }],
            [{ text: '🌐 Dashboard Akun', url: data.dashboard_url }],
        ];
    }

    return { msg, buttons };
}

// --- Fungsi Create Akun (Updated Endpoints) ---

async function createssh(username, password, exp, iplimit, serverId) {
    console.log(`Creating SSH account for ${username}...`);
    if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
        return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
    }

    return new Promise((resolve) => {
        db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
            if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

            const domain = server.domain;
            const auth = server.auth;
            // Menggunakan port 6969
            const param = `:6969/create-ssh?user=${username}&password=${password}&exp=${exp}&limitip=${iplimit}&auth=${auth}`;
            const url = `http://${domain}${param}`;
            
            axios.get(url)
                .then(response => {
                    if (response.data.status === "success") {
                        const { msg, buttons } = formatVpnResponse(response.data.data, 'ssh');
                        return resolve({ msg, buttons });
                    } else {
                        return resolve({ msg: `❌ Terjadi kesalahan: ${response.data.message}`, buttons: [] });
                    }
                })
                .catch(error => {
                    console.error('Error saat membuat SSH:', error.message);
                    return resolve({ msg: '❌ Terjadi kesalahan saat membuat SSH. Silakan coba lagi nanti.', buttons: [] });
                });
        });
    });
}

async function createvmess(username, exp, quota, limitip, serverId) {
    console.log(`Creating VMess account for ${username}...`);
    if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
        return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
    }

    return new Promise((resolve) => {
        db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
            if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

            const domain = server.domain;
            const auth = server.auth;
            // Menggunakan port 6969
            const param = `:6969/create-vmess?user=${username}&exp=${exp}&quota=${quota}&limitip=${limitip}&auth=${auth}`;
            const url = `http://${domain}${param}`;
            
            axios.get(url)
                .then(response => {
                    if (response.data.status === "success") {
                        const { msg, buttons } = formatVpnResponse(response.data.data, 'vmess');
                        return resolve({ msg, buttons });
                    } else {
                        return resolve({ msg: `❌ Terjadi kesalahan: ${response.data.message}`, buttons: [] });
                    }
                })
                .catch(error => {
                    console.error('Error saat membuat VMess:', error.message);
                    return resolve({ msg: '❌ Terjadi kesalahan saat membuat VMess. Silakan coba lagi nanti.', buttons: [] });
                });
        });
    });
}

async function createvless(username, exp, quota, limitip, serverId) {
    console.log(`Creating VLESS account for ${username}...`);
    if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
        return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
    }

    return new Promise((resolve) => {
        db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
            if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

            const domain = server.domain;
            const auth = server.auth;
            // Menggunakan port 6969
            const param = `:6969/create-vless?user=${username}&exp=${exp}&quota=${quota}&limitip=${limitip}&auth=${auth}`;
            const url = `http://${domain}${param}`;
            
            axios.get(url)
                .then(response => {
                    if (response.data.status === "success") {
                        const { msg, buttons } = formatVpnResponse(response.data.data, 'vless');
                        return resolve({ msg, buttons });
                    } else {
                        return resolve({ msg: `❌ Terjadi kesalahan: ${response.data.message}`, buttons: [] });
                    }
                })
                .catch(error => {
                    console.error('Error saat membuat VLESS:', error.message);
                    return resolve({ msg: '❌ Terjadi kesalahan saat membuat VLESS. Silakan coba lagi nanti.', buttons: [] });
                });
        });
    });
}

async function createtrojan(username, exp, quota, limitip, serverId) {
    console.log(`Creating Trojan account for ${username}...`);
    if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
        return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
    }

    return new Promise((resolve) => {
        db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
            if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

            const domain = server.domain;
            const auth = server.auth;
            // Menggunakan port 6969
            const param = `:6969/create-trojan?user=${username}&exp=${exp}&quota=${quota}&limitip=${limitip}&auth=${auth}`;
            const url = `http://${domain}${param}`;
            
            axios.get(url)
                .then(response => {
                    if (response.data.status === "success") {
                        const { msg, buttons } = formatVpnResponse(response.data.data, 'trojan');
                        return resolve({ msg, buttons });
                    } else {
                        return resolve({ msg: `❌ Terjadi kesalahan: ${response.data.message}`, buttons: [] });
                    }
                })
                .catch(error => {
                    console.error('Error saat membuat Trojan:', error.message);
                    return resolve({ msg: '❌ Terjadi kesalahan saat membuat Trojan. Silakan coba lagi nanti.', buttons: [] });
                });
        });
    });
}
// Fungsi Shadowsocks dipertahankan, namun endpoint disesuaikan
async function createshadowsocks(username, exp, quota, limitip, serverId) {
  console.log(`Creating Shadowsocks account for ${username}...`);
  
  if (/\s/.test(username) || /[^a-zA-Z0-9]/.test(username)) {
    return '❌ Username tidak valid. Mohon gunakan hanya huruf dan angka tanpa spasi.';
  }

  return new Promise((resolve) => {
    db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
      if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

      const domain = server.domain;
      const auth = server.auth;
      // Menggunakan port 6969
      const param = `:6969/create-shadowsocks?user=${username}&exp=${exp}&quota=${quota}&limitip=${limitip}&auth=${auth}`;
      const url = `http://${domain}${param}`;
      axios.get(url)
        .then(response => {
          if (response.data.status === "success") {
            const ssData = response.data.data;
            const msg = `
🌟 *AKUN SHADOWSOCKS PREMIUM* 🌟

🔹 *Informasi Akun*
┌─────────────────────
│ *Username* : \`${ssData.username}\`
│ *Domain* : \`${ssData.domain}\`
│ *NS* : \`${ssData.ns_domain}\`
│ *Port TLS* : \`443\`
│ *Port HTTP*: \`80\`
│ *Alter ID* : \`0\`
│ *Security* : \`Auto\`
│ *Network* : \`Websocket (WS)\`
│ *Path* : \`/shadowsocks\`
│ *Path GRPC*: \`shadowsocks-grpc\`
└─────────────────────
🔐 *URL SHADOWSOCKS TLS*
\`\`\`
${ssData.ss_link_ws}
\`\`\`
🔒 *URL SHADOWSOCKS GRPC*
\`\`\`
${ssData.ss_link_grpc}
\`\`\`
🔒 *PUBKEY*
\`\`\`
${ssData.pubkey}
\`\`\`
┌─────────────────────
│ Expiry: \`${ssData.expired}\`
│ Quota: \`${ssData.quota === '0 GB' ? 'Unlimited' : ssData.quota}\`
│ IP Limit: \`${ssData.ip_limit === '0' ? 'Unlimited' : ssData.ip_limit} IP\`
└─────────────────────
`;
            const buttons = [
                [{ text: '🔗 OpenClash Config', url: `https://${ssData.domain}:81/shadowsocks-${ssData.username}.txt` }],
                [{ text: '🌐 Dashboard Akun', url: `https://${ssData.domain}/api/shadowsocks-${ssData.username}.html` }],
            ];
            return resolve({ msg, buttons });
          } else {
            return resolve({ msg: `❌ Terjadi kesalahan: ${response.data.message}`, buttons: [] });
          }
        })
        .catch(error => {
          console.error('Error saat membuat Shadowsocks:', error);
          return resolve({ msg: '❌ Terjadi kesalahan saat membuat Shadowsocks. Silakan coba lagi nanti.', buttons: [] });
        });
    });
  });
}

// --- Fungsi Trial Akun (New) ---

async function trialssh(serverId) {
    console.log(`Creating Trial SSH account on server ${serverId}...`);
    
    return new Promise((resolve) => {
        db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
            if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

            const domain = server.domain;
            const auth = server.auth;
            // Menggunakan port 6969
            const param = `:6969/trial-ssh?auth=${auth}`;
            const url = `http://${domain}${param}`;
            
            axios.get(url)
                .then(response => {
                    if (response.data.status === "success") {
                        const { msg, buttons } = formatVpnResponse(response.data.data, 'ssh');
                        return resolve({ msg: `✨ *AKUN TRIAL SSH* ✨\n\n${msg}`, buttons });
                    } else {
                        return resolve({ msg: `❌ Terjadi kesalahan saat trial: ${response.data.message}`, buttons: [] });
                    }
                })
                .catch(error => {
                    console.error('Error saat membuat Trial SSH:', error.message);
                    return resolve({ msg: '❌ Terjadi kesalahan saat membuat Trial SSH. Silakan coba lagi nanti.', buttons: [] });
                });
        });
    });
}

async function trialvmess(serverId, quota, iplimit) {
    console.log(`Creating Trial VMess account on server ${serverId}...`);
    const exp = 1; // 1 Hari/Jam untuk Trial
    const username = `TrialVMess-${serverId}`; // Username dummy untuk trial

    return new Promise((resolve) => {
        db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
            if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

            const domain = server.domain;
            const auth = server.auth;
            // Menggunakan port 6969
            const param = `:6969/trial-vmess?user=${username}&exp=${exp}&quota=${quota}&limitip=${iplimit}&auth=${auth}`;
            const url = `http://${domain}${param}`;
            
            axios.get(url)
                .then(response => {
                    if (response.data.status === "success") {
                        const { msg, buttons } = formatVpnResponse(response.data.data, 'vmess');
                        return resolve({ msg: `✨ *AKUN TRIAL VMESS* ✨\n\n${msg}`, buttons });
                    } else {
                        return resolve({ msg: `❌ Terjadi kesalahan saat trial: ${response.data.message}`, buttons: [] });
                    }
                })
                .catch(error => {
                    console.error('Error saat membuat Trial VMess:', error.message);
                    return resolve({ msg: '❌ Terjadi kesalahan saat membuat Trial VMess. Silakan coba lagi nanti.', buttons: [] });
                });
        });
    });
}

async function trialvless(serverId, quota, iplimit) {
    console.log(`Creating Trial VLESS account on server ${serverId}...`);
    const exp = 1; // 1 Hari/Jam untuk Trial
    const username = `TrialVLESS-${serverId}`; // Username dummy untuk trial

    return new Promise((resolve) => {
        db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
            if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

            const domain = server.domain;
            const auth = server.auth;
            // Menggunakan port 6969
            const param = `:6969/trial-vless?user=${username}&exp=${exp}&quota=${quota}&limitip=${iplimit}&auth=${auth}`;
            const url = `http://${domain}${param}`;
            
            axios.get(url)
                .then(response => {
                    if (response.data.status === "success") {
                        const { msg, buttons } = formatVpnResponse(response.data.data, 'vless');
                        return resolve({ msg: `✨ *AKUN TRIAL VLESS* ✨\n\n${msg}`, buttons });
                    } else {
                        return resolve({ msg: `❌ Terjadi kesalahan saat trial: ${response.data.message}`, buttons: [] });
                    }
                })
                .catch(error => {
                    console.error('Error saat membuat Trial VLESS:', error.message);
                    return resolve({ msg: '❌ Terjadi kesalahan saat membuat Trial VLESS. Silakan coba lagi nanti.', buttons: [] });
                });
        });
    });
}

async function trialtrojan(serverId, quota, iplimit) {
    console.log(`Creating Trial Trojan account on server ${serverId}...`);
    const exp = 1; // 1 Hari/Jam untuk Trial
    const username = `TrialTrojan-${serverId}`; // Username dummy untuk trial

    return new Promise((resolve) => {
        db.get('SELECT * FROM Server WHERE id = ?', [serverId], (err, server) => {
            if (err || !server) return resolve('❌ Server tidak ditemukan. Silakan coba lagi.');

            const domain = server.domain;
            const auth = server.auth;
            // Menggunakan port 6969
            const param = `:6969/trial-trojan?user=${username}&exp=${exp}&quota=${quota}&limitip=${iplimit}&auth=${auth}`;
            const url = `http://${domain}${param}`;
            
            axios.get(url)
                .then(response => {
                    if (response.data.status === "success") {
                        const { msg, buttons } = formatVpnResponse(response.data.data, 'trojan');
                        return resolve({ msg: `✨ *AKUN TRIAL TROJAN* ✨\n\n${msg}`, buttons });
                    } else {
                        return resolve({ msg: `❌ Terjadi kesalahan saat trial: ${response.data.message}`, buttons: [] });
                    }
                })
                .catch(error => {
                    console.error('Error saat membuat Trial Trojan:', error.message);
                    return resolve({ msg: '❌ Terjadi kesalahan saat membuat Trial Trojan. Silakan coba lagi nanti.', buttons: [] });
                });
        });
    });
}


module.exports = { 
    createssh, createvmess, createvless, createtrojan, createshadowsocks,
    trialssh, trialvmess, trialvless, trialtrojan
};
