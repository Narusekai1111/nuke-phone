document.getElementById("startBtn").addEventListener("click", async () => {
  const statusDiv = document.getElementById("status");
  statusDiv.textContent = "処理中です。しばらくお待ちください...";

  const token = document.getElementById("token").value.trim();
  const serverId = document.getElementById("serverId").value.trim();
  const channelName = document.getElementById("channelName").value.trim();
  const roleName = document.getElementById("roleName").value.trim();
  const serverName = document.getElementById("serverName").value.trim();
  const messageText = document.getElementById("messageText").value.trim();
  const serverIconInput = document.getElementById("serverIcon");

  if (!token || !serverId || !channelName || !messageText) {
    statusDiv.textContent = "必須項目（ボットトークン、サーバーID、チャンネル名、メッセージ）は必ず入力してください。";
    return;
  }

  let serverIconBase64 = null;

  if (serverIconInput.files.length > 0) {
    const file = serverIconInput.files[0];
    serverIconBase64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(null);
      reader.readAsDataURL(file);
    });
  }

  try {
    const res = await fetch("/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        serverId,
        channelName,
        roleName,
        newServerName: serverName || null,
        newServerIconBase64: serverIconBase64,
        messageText,
      }),
    });

    const data = await res.json();
    if (res.ok) {
      statusDiv.textContent = "成功: " + (data.message || "処理が完了しました。");
    } else {
      statusDiv.textContent = "エラー: " + (data.error || "不明なエラーです。");
    }
  } catch (e) {
    statusDiv.textContent = "通信エラーが発生しました。";
  }
});
