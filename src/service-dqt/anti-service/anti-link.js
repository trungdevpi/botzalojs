import { MessageMention, MessageType } from "zlbotdqt";
import { getBotId } from "../../index.js";
import { sendMessageStateQuote } from "../chat-zalo/chat-style/chat-style.js";
import { createBlockSpamLinkImage } from "../../utils/canvas/event-image.js";
import { clearImagePath } from "../../utils/canvas/index.js";
import { getGroupInfoData } from "../info-service/group-info.js";
import { getUserInfoData } from "../info-service/user-info.js";
import { isInWhiteList } from "./white-list.js";
import { removeMention } from "../../utils/format-util.js";
import { getAntiState } from "./index.js";
import { scanQRCode } from "../utilities/qr-scan.js";

async function loadLinkRegex() {
  try {
    const antiState = getAntiState();
    if (!antiState.data.linkRegex) {
      antiState.data.linkRegex =
        "(?:https?:\\/\\/|www\\.)\\S+|(?<!\\w)[a-zA-Z0-9-]+[.,](?:com|net|org|vn|info|biz|io|xyz|me|tv|online|store|club|site|app|blog|dev|tech|cloud|game|shop|click|space|asia|fun|tokyo|xyz|website)(?:\\/\\S*)?(?!\\w)";
    }
    return new RegExp(antiState.data.linkRegex, "gi");
  } catch (error) {
    console.error("Lỗi khi đọc regex link:", error);
    return null;
  }
}

const linkRegex = await loadLinkRegex();

let linkSendCount = {}; // Đếm số link đã gửi của mỗi người dùng
let linkSendTime = {}; // Thời gian gửi link của mỗi người dùng

function checkLink(content) {
  return linkRegex.test(content);
}

export async function antiLink(
  api,
  message,
  isAdminBox,
  groupSettings,
  botIsAdminBox,
  isSelf
) {
  const senderId = message.data.uidFrom;
  const senderName = message.data.dName;
  const threadId = message.threadId;

  if (
    isSelf ||
    isAdminBox ||
    !botIsAdminBox ||
    !groupSettings[threadId]?.removeLinks
  )
    return false;

  // Kiểm tra và xử lý tin nhắn chứa link
  await handleLinkMessage(
    api,
    message,
    groupSettings,
    isAdminBox,
    threadId,
    senderId,
    senderName
  );
}

export async function handleAntiLinkCommand(
  api,
  message,
  groupSettings
) {
  const threadId = message.threadId;
  let isChangeSetting = false;
  const content = removeMention(message);
  const status = content.split(" ")[1]?.toLowerCase();
  if (!groupSettings[threadId]) {
    groupSettings[threadId] = {};
  }

  const newStatus =
    status === "on"
      ? true
      : status === "off"
        ? false
        : !groupSettings[threadId].removeLinks;
  groupSettings[threadId].removeLinks = newStatus;
  isChangeSetting = true;
  const statusText = newStatus ? "bật" : "tắt";
  const caption = `Chức năng xóa link đã được ${statusText}!`;
  await sendMessageStateQuote(api, message, caption, newStatus, 300000);

  return isChangeSetting;
}

async function handleLinkMessage(
  api,
  message,
  groupSettings,
  isAdminBox,
  threadId,
  senderId,
  senderName
) {
  let content = message.data.content;
  content = content.title ? content.title : content;
  const isRecommendedMessage = message.data.msgType === "chat.recommended";
  const isImage = message.data.msgType === "chat.photo";
  const isPlainText = typeof content === "string";
  let isDeleteLink = false;
  const botId = getBotId();
  const isUserWhiteList = isInWhiteList(groupSettings, threadId, senderId);

  if (isUserWhiteList) return isDeleteLink;

  if (isRecommendedMessage) {
    await api.deleteMessage(message, false).catch(console.error);
    isDeleteLink = true;
  }

  if (!isDeleteLink && isImage) {
    const linkImage = message.data?.content?.href;
    if (linkImage) {
      const result = await scanQRCode(linkImage);
      if (result.success) {
        if (checkLink(result.data.content)) {
          await api.deleteMessage(message, false).catch(console.error);
          isDeleteLink = true;
        }
      }
    }
  }

  const hasLink = isPlainText && checkLink(content);

  if (!isDeleteLink && hasLink) {
    const matches = content.match(linkRegex);
    if (matches) {
      await api.deleteMessage(message, false).catch(console.error);
      isDeleteLink = true;
    }
  }

  if (isDeleteLink) {
    if (!isUserWhiteList) {
      await updateLinkCount(
        api,
        message,
        threadId,
        senderId,
        senderName,
        botId,
        isAdminBox
      );
    }
  }
  return isDeleteLink;
}

async function updateLinkCount(
  api,
  message,
  threadId,
  senderId,
  senderName,
  botId,
  isAdminBox
) {
  if (!linkSendCount[senderId]) {
    linkSendCount[senderId] = 0;
    linkSendTime[senderId] = Date.now();
  }

  linkSendCount[senderId]++;

  if (isAdminBox && senderId !== botId) {
    return;
  }

  if (Date.now() - linkSendTime[senderId] < 60 * 1000) {
    if (linkSendCount[senderId] > 2) {
      await blockUser(api, message, threadId, senderId, senderName);
      return;
    }
  } else {
    linkSendCount[senderId] = 1;
    linkSendTime[senderId] = Date.now();
  }

  await sendWarningMessage(api, message, senderId, senderName, linkSendCount[senderId]);
}

async function blockUser(api, message, threadId, senderId, senderName) {
  try {
    await api.blockUsers(threadId, [senderId]);
    const groupInfo = await getGroupInfoData(api, threadId);
    const userInfo = await getUserInfoData(api, senderId);
    const imagePath = await createBlockSpamLinkImage(
      userInfo,
      groupInfo.name,
      groupInfo.groupType,
      userInfo.gender
    );

    await api.sendMessage(
      {
        msg: "",
        attachments: imagePath ? [imagePath] : [],
        quote: message,
      },
      threadId,
      MessageType.GroupMessage
    );

    try {
      await api.sendMessage(
        {
          msg: `Chào [ ${senderName} ]\nBạn đã bị chặn khỏi nhóm vì gửi quá nhiều link!`,
          attachments: imagePath ? [imagePath] : [],
          quote: message,
        },
        senderId,
        MessageType.DirectMessage
      );
    } catch (error) {
      console.error(`Đéo thể gửi tin nhắn tới ${senderId}:`, error.message);
    }

    await clearImagePath(imagePath);
  } catch {
    console.error(`Đéo thể chặn người dùng ${senderName}`);
  }
}

async function sendWarningMessage(api, message, senderId, senderName, count) {
  try {
    let caption = `⚠️ Cảnh cáo ${senderName}!\nỞ đây Đại Ca tao cấm gửi link`;
    switch (count) {
      case 2:
        caption = `⚠️ Cảnh cáo ${senderName}!\nNgừng send link, trước khi, mọi chuyện dần tồi tệ hơn!`;
        break;
    }
    await api.sendMessage(
      {
        msg: caption,
        mentions: [
          MessageMention(senderId, senderName.length, "⚠️ Cảnh cáo ".length),
        ],
        quote: message,
        ttl: 300000,
      },
      message.threadId,
      MessageType.GroupMessage
    );
    await api.sendMessage(
      {
        msg: `Admin đã chặn gửi link trong nhóm, link của ${senderName} bị xóa!`,
        quote: message,
      },
      senderId,
      MessageType.DirectMessage
    );
  } catch (error) {
    console.error(`Đéo thể gửi tin nhắn tới ${senderId}:`, error.message);
  }
}
