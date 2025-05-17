const express = require("express");
const { Client, GatewayIntentBits, Partials } = require("discord.js");
const bodyParser = require("body-parser");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.json({ limit: "10mb" })); // 画像アイコンのbase64送信に対応

const PORT = process.env.PORT || 3000;

app.post("/start", async (req, res) => {
  const {
    token,
    serverId,
    channelName,
    roleName,
    newServerName,
    newServerIconBase64,
    messageText,
  } = req.body;

  if (!token || !serverId || !channelName || !messageText) {
    return res.status(400).json({ error: "必須項目が足りません。" });
  }

  // Discordクライアント作成
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel],
  });

  try {
    await client.login(token);
  } catch (e) {
    return res.status(400).json({ error: "ボットトークンが無効です。" });
  }

  const guild = client.guilds.cache.get(serverId);
  if (!guild) {
    client.destroy();
    return res.status(400).json({ error: "指定サーバーが見つかりません。" });
  }

  try {
    // サーバー名変更
    if (newServerName) {
      await guild.setName(newServerName);
    }

    // サーバーアイコン変更
    if (newServerIconBase64) {
      // base64にdata:image/png;base64,...がついている場合もあり。整形
      const base64data = newServerIconBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64data, "base64");
      await guild.setIcon(buffer);
    }

    // --- チャンネル削除 ---
    // 権限に注意（botに権限があることが前提）
    const channels = guild.channels.cache.filter(ch => ch.type === 0); // テキストチャンネルのみ
    for (const ch of channels.values()) {
      await ch.delete().catch(() => {}); // エラーは無視
    }

    // --- ロール削除 ---
    const roles = guild.roles.cache.filter(role => !role.managed && role.id !== guild.id); // 管理ロールと@everyone以外
    for (const role of roles.values()) {
      await role.delete().catch(() => {});
    }

    // --- チャンネル作成 30個 ---
    const createdChannels = [];
    for (let i = 0; i < 30; i++) {
      const name = channelName + (i === 0 ? "" : `-${i + 1}`);
      const ch = await guild.channels.create({
        name,
        type: 0, // テキストチャンネル
      });
      createdChannels.push(ch);
    }

    // --- ロール作成 15個 ---
    for (let i = 0; i < 15; i++) {
      const name = roleName + (i === 0 ? "" : `-${i + 1}`);
      await guild.roles.create({
        name,
      });
    }

    // --- 作成したチャンネルにメッセージ送信 ---
    // 1チャンネルに30回、1秒に2回固定で送信

    for (const ch of createdChannels) {
      for (let i = 0; i < 30; i++) {
        await ch.send(messageText).catch(() => {});
        if (i < 29) await new Promise((r) => setTimeout(r, 500)); // 0.5秒ごとに送信 → 2回/秒
      }
    }

    client.destroy();
    return res.json({ success: true, message: "処理が完了しました。" });
  } catch (err) {
    client.destroy();
    return res.status(500).json({ error: "処理中にエラーが発生しました。", detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
