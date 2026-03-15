const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db.json');

// Initialize DB if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify([]));
}

function getRequests() {
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
}

function saveRequests(requests) {
  fs.writeFileSync(DB_FILE, JSON.stringify(requests, null, 2));
}

// Geocoding helper
async function geocodeAddress(address, postalCode) {
  try {
    const query = encodeURIComponent(`${address}, ${postalCode} Gien, France`);
    const resp = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
      headers: { 'User-Agent': 'GienBookResale/1.0' }
    });
    const data = await resp.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
  } catch (error) {
    console.error("Geocoding failed", error);
  }
  return { lat: null, lng: null };
}

// ==== Discord Bot Setup ====
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

client.once('ready', () => {
  console.log(`🤖 Discord Bot logged in as ${client.user.tag}`);
  updateDashboard(); // Run once on startup
});

// Helper for Dropdown — uses '|' as separator to avoid splitting multi-word statuses
function getStatusActionRow(currentStatus, reqId) {
  const options = [
    { label: 'En attente',       value: `Pending|${reqId}`,          emoji: '⏳' },
    { label: 'Collecte prévue',  value: `Pickup Scheduled|${reqId}`, emoji: '📅' },
    { label: 'Livres collectés', value: `Books Collected|${reqId}`,  emoji: '📦' },
    { label: 'Livres vendus',    value: `Books Sold|${reqId}`,       emoji: '🏷️' },
    { label: 'Paiement envoyé',  value: `Payment Sent|${reqId}`,     emoji: '💶' },
  ];

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`status_select`)
    .setPlaceholder('Changer le statut...')
    .addOptions(
      options.map(opt =>
        new StringSelectMenuOptionBuilder()
          .setLabel(opt.label)
          .setValue(opt.value)
          .setEmoji(opt.emoji)
          .setDefault(opt.value.startsWith(currentStatus))
      )
    );

  return new ActionRowBuilder().addComponents(selectMenu);
}

// Live Dashboard Logic
async function updateDashboard() {
  if (!client.isReady()) return;
  const guild = client.guilds.cache.first();
  if (!guild) return;

  let dashboardChannel = guild.channels.cache.find(c => c.name === 'dashboard-gien');
  if (!dashboardChannel) {
    dashboardChannel = await guild.channels.create({ name: 'dashboard-gien', type: 0 });
  }

  const requests = getRequests();
  const pending      = requests.filter(r => r.status === 'Pending');
  const scheduled    = requests.filter(r => r.status === 'Pickup Scheduled');
  const collected    = requests.filter(r => r.status === 'Books Collected');
  const sold         = requests.filter(r => r.status === 'Books Sold');
  const active       = [...pending, ...scheduled, ...collected, ...sold];

  // Build a static map URL using OpenStreetMap + markers from mappable requests
  const mappable = active.filter(r => r.lat && r.lng);
  let mapUrl = null;
  if (mappable.length > 0) {
    const center = `${mappable[0].lat},${mappable[0].lng}`;
    const markers = mappable.map(r => `${r.lat},${r.lng}`).join('|');
    mapUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${center}&zoom=12&size=600x300&maptype=mapnik&markers=${markers}`;
  }

  // Token allows Discord link to auto-authenticate the admin panel
  const ADMIN_TOKEN = 'discord-admin-access-2024';
  const adminUrl = `http://localhost:5173/admin?token=${ADMIN_TOKEN}`;

  const embed = new EmbedBuilder()
    .setTitle('📊 Dashboard — Gien Débarras Livres')
    .setColor(0x6366f1)
    .setDescription(
      `🕐 Mis à jour : <t:${Math.floor(Date.now() / 1000)}:R>\n\n` +
      `**${active.length}** collecte(s) active(s) au total\n` +
      `⏳ En attente : **${pending.length}** | 📅 Prévues : **${scheduled.length}** | 📦 Collectées : **${collected.length}** | 🏷️ À payer : **${sold.length}**`
    )
    .setURL(adminUrl)
    .setFooter({ text: `Cliquez sur le titre pour ouvrir le panneau admin → ${adminUrl}` });

  if (mapUrl) embed.setImage(mapUrl);

  // List each active order
  active.forEach(req => {
    const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${req.address}, ${req.postalCode} Gien, France`)}`;
    embed.addFields({
      name: `${req.name} — ${req.status}`,
      value: `📍 [${req.address}](${gmaps})\n🕒 ${req.availability} | 📦 ${req.bookCount} livres | \`${req.id}\``,
      inline: false
    });
  });

  const messages = await dashboardChannel.messages.fetch({ limit: 15 });
  const botMessage = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);

  if (botMessage) {
    await botMessage.edit({ embeds: [embed] });
  } else {
    await dashboardChannel.send({ embeds: [embed] });
  }
}


// Map Channel Rename & Category Management
const CATEGORY_NAMES = {
  'Pending': '📥 En Attente',
  'Pickup Scheduled': '🚚 Livraison Prévue',
  'Books Collected': '📦 Livres Collectés',
  'Books Sold': '🏷️ Livres Vendus',
  'Payment Sent': '💶 Paiement Envoyé'
};

async function getOrCreateCategory(guild, categoryName) {
  let category = guild.channels.cache.find(c => c.type === 4 && c.name === categoryName); // 4 = GuildCategory
  if (!category) {
    category = await guild.channels.create({ name: categoryName, type: 4 });
  }
  return category;
}

async function handleChannelUpdate(channel, newStatus) {
  if (!channel) return;
  const guild = channel.guild;
  
  // 1. Move to Category
  const categoryName = CATEGORY_NAMES[newStatus];
  if (categoryName) {
    const category = await getOrCreateCategory(guild, categoryName);
    if (channel.parentId !== category.id) {
      await channel.setParent(category.id).catch(err => console.error("Category move failed", err));
    }
  }

  // 2. Rename Checkmark logic
  const currentName = channel.name;
  if (newStatus === 'Books Collected' || newStatus === 'Books Sold' || newStatus === 'Payment Sent') {
    if (!currentName.startsWith('✅-')) {
      await channel.setName(`✅-${currentName}`).catch(err => console.error("Rename limit hit", err));
    }
  } else {
    if (currentName.startsWith('✅-')) {
      await channel.setName(currentName.replace('✅-', '')).catch(err => console.error("Rename limit hit", err));
    }
  }
}

// Handle Select Menu & Modal interactions
client.on('interactionCreate', async interaction => {

  // ── Select Menu ──
  if (interaction.isStringSelectMenu() && interaction.customId === 'status_select') {
    const pipeIdx = interaction.values[0].indexOf('|');
    const newStatus = interaction.values[0].substring(0, pipeIdx);
    const reqId = interaction.values[0].substring(pipeIdx + 1);

    // Special case: Books Collected → show a Modal form before updating
    if (newStatus === 'Books Collected') {
      const modal = new ModalBuilder()
        .setCustomId(`books_collected|${reqId}`)
        .setTitle('📦 Livres Collectés — Détails');

      const countInput = new TextInputBuilder()
        .setCustomId('bookCount')
        .setLabel('Nombre de livres récupérés')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 42')
        .setRequired(true);

      const priceInput = new TextInputBuilder()
        .setCustomId('salePrice')
        .setLabel('Prix de vente total estimé (€)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Ex: 126')
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(countInput),
        new ActionRowBuilder().addComponents(priceInput)
      );

      await interaction.showModal(modal);
      return; // Modal handles the rest — do NOT defer here
    }

    // Normal status change
    await interaction.deferReply({ ephemeral: true });
    const requests = getRequests();
    const reqIndex = requests.findIndex(r => r.id === reqId);

    if (reqIndex !== -1) {
      requests[reqIndex].status = newStatus;
      saveRequests(requests);
      handleChannelUpdate(interaction.channel, newStatus);

      await interaction.editReply({ content: `✅ Statut mis à jour → **${newStatus}**` });
      await interaction.message.edit({ components: [getStatusActionRow(newStatus, reqId)] }).catch(console.error);
      updateDashboard();
    } else {
      await interaction.editReply({ content: '❌ Demande introuvable.' });
    }
  }

  // ── Modal Submit: Books Collected ──
  if (interaction.isModalSubmit() && interaction.customId.startsWith('books_collected|')) {
    await interaction.deferReply({ ephemeral: true });
    const reqId = interaction.customId.split('|')[1];
    const actualCount = parseInt(interaction.fields.getTextInputValue('bookCount'));
    const salePrice = parseFloat(interaction.fields.getTextInputValue('salePrice'));

    if (isNaN(actualCount) || isNaN(salePrice)) {
      return interaction.editReply({ content: '❌ Valeurs invalides. Entrez des nombres valides.' });
    }

    const sellerPayout = Math.round(salePrice * 0.6 * 100) / 100;
    const profit = Math.round(salePrice * 0.4 * 100) / 100;

    const requests = getRequests();
    const reqIndex = requests.findIndex(r => r.id === reqId);
    if (reqIndex === -1) return interaction.editReply({ content: '❌ Demande introuvable.' });

    requests[reqIndex].status = 'Books Collected';
    requests[reqIndex].actualBookCount = actualCount;
    requests[reqIndex].salePrice = salePrice;
    requests[reqIndex].sellerPayout = sellerPayout;
    requests[reqIndex].profit = profit;
    saveRequests(requests);

    handleChannelUpdate(interaction.channel, 'Books Collected');

    // Update the original message's select menu
    const msgs = await interaction.channel.messages.fetch({ limit: 20 });
    const msgWithMenu = msgs.find(m => m.components && m.components.length > 0 && m.author.id === client.user.id);
    if (msgWithMenu) {
      await msgWithMenu.edit({ components: [getStatusActionRow('Books Collected', reqId)] }).catch(console.error);
    }

    // Post a summary embed in the channel
    const summaryEmbed = new EmbedBuilder()
      .setTitle('💶 Données de collecte enregistrées')
      .setColor(0x22C55E)
      .addFields(
        { name: 'Livres récupérés', value: `${actualCount}`, inline: true },
        { name: 'Prix de vente', value: `${salePrice} €`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: 'À verser au vendeur (60%)', value: `**${sellerPayout} €**`, inline: true },
        { name: 'Bénéfice plateforme (40%)', value: `**${profit} €**`, inline: true }
      )
      .setFooter({ text: 'Ces données sont visibles sur le dashboard web.' });

    await interaction.editReply({ embeds: [summaryEmbed] });
    await interaction.channel.send({ embeds: [summaryEmbed] });
    updateDashboard();
  }
});

// ==== Bot Command & Message Handling ====
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const content = message.content.trim();
  const requests = getRequests();
  const reqIndex = requests.findIndex(r => r.discordChannelId === message.channel.id);

  // ──────────────────────────────────────────────────────────────────
  // Command: !rep "message" — reply to user from admin in their channel
  // ──────────────────────────────────────────────────────────────────
  if (content.startsWith('!rep ')) {
    if (reqIndex === -1) {
      return message.reply('❌ Ce salon n\'est associé à aucune commande.');
    }
    const replyText = content.slice(5).replace(/^"(.*)"$/, '$1').trim();
    if (!replyText) return message.reply('⚠️ Usage : `!rep "votre message"`');

    if (!requests[reqIndex].messages) requests[reqIndex].messages = [];
    requests[reqIndex].messages.push({
      sender: 'Admin',
      text: replyText,
      timestamp: new Date().toISOString()
    });
    saveRequests(requests);
    await message.react('✅');
    await message.reply(`📤 Message transmis à **${requests[reqIndex].name}** sur le site web.`);
    return;
  }

  // ──────────────────────────────────────────────────────────────────
  // Command: !suiv "numéro_de_suivi" — send parcel tracking link to user
  // ──────────────────────────────────────────────────────────────────
  if (content.startsWith('!suiv ')) {
    if (reqIndex === -1) {
      return message.reply('❌ Ce salon n\'est associé à aucune commande.');
    }
    const trackingNumber = content.slice(6).replace(/"/g, '').trim();
    if (!trackingNumber) return message.reply('⚠️ Usage : `!suiv "NUMÉRO_DE_COLIS"`');

    requests[reqIndex].parcelTracking = trackingNumber;
    if (!requests[reqIndex].messages) requests[reqIndex].messages = [];
    requests[reqIndex].messages.push({
      sender: 'Admin',
      text: `📦 Votre numéro de suivi de colis est : **${trackingNumber}**\n🔗 Suivez votre colis ici : https://www.laposte.fr/outils/suivre-vos-envois?code=${trackingNumber}`,
      timestamp: new Date().toISOString(),
      isTracking: true
    });
    saveRequests(requests);
    await message.react('📦');
    await message.reply(`📤 Numéro de suivi **${trackingNumber}** envoyé à **${requests[reqIndex].name}** avec le lien de suivi !`);
    return;
  }

  // ──────────────────────────────────────────────────────────────────
  // Command: !livres <count> <price> — record actual books & sale price
  // ──────────────────────────────────────────────────────────────────
  if (content.startsWith('!livres ')) {
    if (reqIndex === -1) {
      return message.reply('❌ Ce salon n\'est associé à aucune commande.');
    }
    const parts = content.slice(8).trim().split(/\s+/);
    const actualCount = parseInt(parts[0]);
    const salePrice = parseFloat(parts[1]);

    if (isNaN(actualCount) || isNaN(salePrice)) {
      return message.reply('⚠️ Usage : `!livres <nombre_livres> <prix_de_vente>` — ex: `!livres 42 126`');
    }

    const sellerPayout = Math.round(salePrice * 0.6 * 100) / 100;
    const profit = Math.round(salePrice * 0.4 * 100) / 100;

    requests[reqIndex].actualBookCount = actualCount;
    requests[reqIndex].salePrice = salePrice;
    requests[reqIndex].sellerPayout = sellerPayout;
    requests[reqIndex].profit = profit;
    saveRequests(requests);

    const summaryEmbed = new EmbedBuilder()
      .setTitle('💶 Résumé Financier enregistré')
      .setColor(0x22C55E)
      .addFields(
        { name: 'Livres récupérés', value: `${actualCount}`, inline: true },
        { name: 'Prix de vente total', value: `${salePrice} €`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: 'À verser au vendeur (60%)', value: `**${sellerPayout} €**`, inline: true },
        { name: 'Bénéfice plateforme (40%)', value: `**${profit} €**`, inline: true }
      )
      .setFooter({ text: 'Ces données sont maintenant visibles sur le dashboard web.' });

    await message.reply({ embeds: [summaryEmbed] });
    await message.react('✅');
    updateDashboard();
    return;
  }

  // ──────────────────────────────────────────────────────────────────
  // Block plain messages — remind admin to use commands
  // ──────────────────────────────────────────────────────────────────
  if (reqIndex !== -1) {
    if (!content.startsWith('!')) {
      await message.reply(
        'ℹ️ Commandes disponibles :\n' +
        '`!rep "message"` → envoyer un message au client\n' +
        '`!suiv "NUMÉRO"` → envoyer un numéro de colis\n' +
        '`!livres <n> <prix>` → enregistrer livres collectés et prix'
      );
    }
  }
});

// ==== Helper: Log to #logs channel ====
async function logToLogsChannel(guild, req) {
  let logsChannel = guild.channels.cache.find(c => c.name === 'logs-commandes');
  if (!logsChannel) {
    logsChannel = await guild.channels.create({ name: 'logs-commandes', type: 0 });
  }
  const embed = new EmbedBuilder()
    .setTitle(`📋 Commande Terminée — ${req.name}`)
    .setColor(0x22C55E)
    .addFields(
      { name: 'Numéro de suivi',   value: req.id,                                           inline: true },
      { name: 'Nom',               value: req.name,                                          inline: true },
      { name: 'Téléphone',         value: req.phone,                                         inline: true },
      { name: 'Adresse',           value: `${req.address}, ${req.postalCode}`,               inline: false },
      { name: 'Livres',            value: req.bookCount,                                     inline: true },
      { name: 'Date demande',      value: new Date(req.date).toLocaleDateString('fr-FR'),    inline: true },
      { name: 'Numéro de colis',   value: req.parcelTracking || 'Non renseigné',             inline: true }
    )
    .setFooter({ text: 'Ce salon Discord sera supprimé dans 3 jours.' });
  await logsChannel.send({ embeds: [embed] });
}

// ==== Cron Jobs ====

// Daily 8h reminder
cron.schedule('0 8 * * *', async () => {
  if (!client.isReady()) return;
  const guild = client.guilds.cache.first();
  if (!guild) return;
  const dashboardChannel = guild.channels.cache.find(c => c.name === 'dashboard-gien');
  if (dashboardChannel) {
    const requests = getRequests();
    const pendingPickups = requests.filter(r => r.status === 'Pending' || r.status === 'Pickup Scheduled');
    const pendingPayments = requests.filter(r => r.status === 'Books Sold');
    await dashboardChannel.send(
      `@everyone 🌅 **Rappel du matin !**\n` +
      `📦 **${pendingPickups.length}** collecte(s) en attente ou prévue(s)\n` +
      `💶 **${pendingPayments.length}** paiement(s) à envoyer aux vendeurs\n` +
      `Consultez le dashboard ci-dessus pour plus de détails.`
    );
  }
});

// Check every hour for channels to delete (3 days after Payment Sent)
cron.schedule('0 * * * *', async () => {
  if (!client.isReady()) return;
  const guild = client.guilds.cache.first();
  if (!guild) return;
  const requests = getRequests();
  const now = Date.now();
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  for (const req of requests) {
    if (req.status === 'Payment Sent' && req.discordChannelId && req.paymentSentAt) {
      const elapsed = now - new Date(req.paymentSentAt).getTime();
      if (elapsed >= THREE_DAYS_MS) {
        const channel = guild.channels.cache.get(req.discordChannelId);
        if (channel) {
          await logToLogsChannel(guild, req);
          await channel.delete('Commande terminée depuis 3 jours').catch(console.error);
          req.discordChannelId = null; // prevent future attempts
        }
      }
    }
  }
  saveRequests(requests);
});


if (process.env.DISCORD_TOKEN) {
  client.login(process.env.DISCORD_TOKEN).catch(console.error);
}


// ==== Express Routes ====

app.get('/api/requests', (req, res) => {
  res.json(getRequests());
});

app.post('/api/requests', async (req, res) => {
  const newRequest = {
    ...req.body,
    status: 'Pending',
    date: new Date().toISOString(),
    messages: []
  };

  const coords = await geocodeAddress(newRequest.address, newRequest.postalCode);
  newRequest.lat = coords.lat;
  newRequest.lng = coords.lng;

  const requests = getRequests();
  requests.unshift(newRequest);

  // Bot creation execution
  try {
    if (client.isReady()) {
      const guild = client.guilds.cache.first();
      if (guild) {
        const safeName = `collecte-${newRequest.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
        
        // Ensure pending category
        const category = await getOrCreateCategory(guild, CATEGORY_NAMES['Pending']);
        
        const channel = await guild.channels.create({ 
          name: safeName, 
          type: 0,
          parent: category.id
        });
        
        newRequest.discordChannelId = channel.id;

        const row = getStatusActionRow('Pending', newRequest.id);
        const embed = new EmbedBuilder()
          .setTitle("📋 Détails de la Collecte")
          .setColor(0x6366f1)
          .addFields(
            { name: "Nom", value: newRequest.name, inline: true },
            { name: "Téléphone", value: newRequest.phone, inline: true },
            { name: "Numéro de Suivi", value: newRequest.id, inline: true },
            { name: "Adresse", value: `${newRequest.address}, ${newRequest.postalCode} Gien`, inline: false },
            { name: "Nombre de livres", value: newRequest.bookCount, inline: true },
            { name: "Disponibilité", value: newRequest.availability, inline: true }
          );

        await channel.send({ 
          content: `@everyone 🚨 **NOUVELLE DEMANDE DE COLLECTE**\n${newRequest.name} a programmé une collecte à l'adresse **${newRequest.address}**.`, 
          embeds: [embed], 
          components: [row] 
        });
      }
    }
  } catch (err) {
    console.error("Failed Discord creation", err);
  }

  saveRequests(requests);
  updateDashboard();
  res.json({ success: true, request: newRequest });
});

app.put('/api/requests/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const requests = getRequests();
  const reqIndex = requests.findIndex(r => r.id === id);
  if (reqIndex !== -1) {
    requests[reqIndex].status = status;
    // Record timestamp when payment is sent (used for 3-day auto-delete)
    if (status === 'Payment Sent' && !requests[reqIndex].paymentSentAt) {
      requests[reqIndex].paymentSentAt = new Date().toISOString();
    }
    saveRequests(requests);
    
    // Attempt to update discord components
    if (client.isReady() && requests[reqIndex].discordChannelId) {
      try {
        const channel = client.channels.cache.get(requests[reqIndex].discordChannelId);
        if (channel) {
          handleChannelUpdate(channel, status);
          const msgs = await channel.messages.fetch({ limit: 50 });
          const originalMsg = msgs.find(m => m.embeds.length > 0 && m.author.id === client.user.id);
          if (originalMsg) {
            const updatedRow = getStatusActionRow(status, id);
            await originalMsg.edit({ components: [updatedRow] }).catch(console.error);
          }
          await channel.send(`ℹ️ Le statut a été modifié sur le site web : **${status}**`);
        }
      } catch (err) {}
    }
    
    updateDashboard();
    res.json({ success: true, request: requests[reqIndex] });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.delete('/api/requests/:id', async (req, res) => {
  const { id } = req.params;
  const requests = getRequests();
  const reqToDelete = requests.find(r => r.id === id);
  if (reqToDelete && client.isReady() && reqToDelete.discordChannelId) {
    try {
      const channel = client.channels.cache.get(reqToDelete.discordChannelId);
      if (channel) await channel.delete();
    } catch(err){}
  }

  const newRequests = requests.filter(r => r.id !== id);
  saveRequests(newRequests);
  updateDashboard();
  res.json({ success: true });
});

// --- CHAT ENDPOINTS ---
app.get('/api/requests/:id', (req, res) => {
  const requests = getRequests();
  const request = requests.find(r => r.id === req.params.id);
  if (request) res.json(request);
  else res.status(404).json({ error: "Not found" });
});

app.post('/api/requests/:id/messages', async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  
  const requests = getRequests();
  const reqIndex = requests.findIndex(r => r.id === id);
  if (reqIndex !== -1) {
    if (!requests[reqIndex].messages) requests[reqIndex].messages = [];
    requests[reqIndex].messages.push({
      sender: 'User',
      text,
      timestamp: new Date().toISOString()
    });
    saveRequests(requests);

    const channelId = requests[reqIndex].discordChannelId;
    if (channelId && client.isReady()) {
      const channel = client.channels.cache.get(channelId);
      if (channel) {
        await channel.send(`💬 **[Message Client]** ${text}`);
      }
    }
    res.json({ success: true, request: requests[reqIndex] });
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend local server running on http://localhost:${PORT}`);
});
