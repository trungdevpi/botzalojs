import fs from 'fs';
import path from 'path';
import { getGlobalPrefix, setGlobalPrefix } from "../../service-dqt/service.js";

const commandConfigPath = path.join(process.cwd(), "assets", "json-data", "command.json");

export async function handlePrefixCommand(api, message, threadId, isAdmin) {
  const content = message.data.content.trim();
  const currentPrefix = getGlobalPrefix();
  
  if (!content.startsWith(`${currentPrefix}prefix`) && !content.startsWith(`prefix`)) {
    return false;
  }

  const args = content.slice(content.startsWith(currentPrefix) ? currentPrefix.length + 6 : 6).trim(); // +6 là độ dài của "prefix"

  if (!args) {
    await api.sendMessage(
      {
        msg: `Prefix bây giờ của bot là: ${currentPrefix}`,
        quote: message,
        ttl: 30000
      },
      threadId, 
      message.type
    );
    return true;
  }

  if (!isAdmin) {
    await api.sendMessage(
      {
        msg: "❌ Đéo có quyền thay đổi prefix của bot!",
        quote: message,
        ttl: 30000
      },
      threadId,
      message.type
    );
    return true;
  }

  if (args.includes(" ")) {
    await api.sendMessage(
      {
        msg: "❌ Prefix Đéo được chứa khoảng trắng!",
        quote: message,
        ttl: 30000
      },
      threadId,
      message.type
    );
    return true;
  }

  try {
    updatePrefix(args);
    setGlobalPrefix(args);
    await api.sendMessage(
      {
        msg: `✅ Prefix của bot đã được thành công!\nPrefix mới là: ${args}`,
        quote: message,
        ttl: 60000
      },
      threadId,
      message.type
    );
  } catch (error) {
    console.error("Lỗi khi cập nhật prefix:", error);
    await api.sendMessage(
      {
        msg: "❌ Đã xảy ra lỗi khi thay đổi prefix!",
        quote: message,
        ttl: 30000
      },
      threadId,
      message.type
    );
  }

  return true;
}

function updatePrefix(newPrefix) {
  try {
    const config = JSON.parse(fs.readFileSync(commandConfigPath, 'utf8'));
    config.prefix = newPrefix;
    fs.writeFileSync(commandConfigPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error("Lỗi khi cập nhật prefix:", error);
    throw error;
  }
}
