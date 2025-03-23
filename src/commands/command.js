import { writeGroupSettings } from "../utils/io-json.js";
import { handleMuteList, handleMuteUser, handleUnmuteUser } from "../service-dqt/anti-service/mute-user.js";
import { handleWelcomeBye, handleApprove } from "./bot-manager/welcome-bye.js";
import { handleBlock, handleKick } from "./bot-manager/group-manage.js";
import { handleActiveBotUser, handleActiveGameUser, managerData } from "./bot-manager/active-bot.js";
import { helpCommand, adminCommand, gameInfoCommand } from "./instructions/help.js";

import { askGPTCommand } from "../service-dqt/api-crawl/content/gpt.js";
import { askGeminiCommand } from "../service-dqt/api-crawl/assistant-ai/gemini.js";
import { weatherCommand } from "../service-dqt/api-crawl/content/weather.js";

import { groupInfoCommand } from "../service-dqt/info-service/group-info.js";
import { userInfoCommand } from "../service-dqt/info-service/user-info.js";
import { handleRankCommand } from "../service-dqt/info-service/rank-chat.js";

import { chatAll } from "../service-dqt/chat-zalo/chat-general/chat-all.js";
import { sendGifLocal, sendGifRemote } from "../service-dqt/chat-zalo/chat-special/send-gif/send-gif.js";
import { searchImagePinterest } from "../service-dqt/api-crawl/pinterest/pinterest-service.js";
import { sendImage } from "../service-dqt/chat-zalo/chat-special/send-image/send-image.js";
import { handleTikTokCommand } from "../service-dqt/api-crawl/tiktok/tiktok-service.js";
import { handleVideoCommand } from "../service-dqt/chat-zalo/chat-special/send-video/send-video.js";

import { chatWithSimsimi } from "../service-dqt/chat-bot/simsimi/simsimi-api.js";
import { translateCommand } from "../service-dqt/api-crawl/content/translate.js";
import { handleLearnCommand, handleReplyCommand } from "../service-dqt/chat-bot/bot-learning/dqt-bot.js";
import { handleOnlyText } from "../service-dqt/anti-service/anti-not-text.js";
import { scoldUser } from "../service-dqt/chat-bot/scold-user/scold-user.js";
import { getBotDetails } from "../service-dqt/info-service/bot-info.js";
import {
  handleBanCommand,
  handleBankCommand,
  handleBuffCommand,
  handleClaimDailyReward,
  handleLoginPlayer,
  handleLogoutPlayer,
  handleMyCard,
  handleNapCommand,
  handleRegisterPlayer,
  handleRutCommand,
  handleTopPlayers,
  handleUnbanCommand,
} from "../service-dqt/game-service/index.js";
import { handleAntiLinkCommand } from "../service-dqt/anti-service/anti-link.js";
import { getCommandConfig, isAdmin } from "../index.js";
import {
  sendMessageFromSQL,
  sendMessageInsufficientAuthority,
} from "../service-dqt/chat-zalo/chat-style/chat-style.js";
import { handleAdminHighLevelCommands, handleListAdmin } from "./bot-manager/admin-manager.js";
import { handleAntiSpamCommand } from "../service-dqt/anti-service/anti-spam.js";
import {
  handleKeyCommands,
  handleBlockBot,
  handleUnblockBot,
  handleListBlockBot,
} from "./bot-manager/group-manage.js";
import { listCommands } from "./instructions/help.js";
import { handleTaiXiuCommand } from "../service-dqt/game-service/tai-xiu/tai-xiu.js";
import { handlePrefixCommand } from "./bot-manager/prefix.js";
import { getGlobalPrefix } from "../service-dqt/service.js";
import { handleNongTraiCommand } from "../service-dqt/game-service/nong-trai/nong-trai.js";
import { userBussinessCardCommand } from "../service-dqt/info-service/bussiness-card.js";
import { handleStickerCommand } from "../service-dqt/chat-zalo/chat-special/send-sticker/send-sticker.js";
import {
  checkNotFindCommand,
  handleAliasCommand,
  handleChangeGroupLink,
  handleGetLinkInQuote,
  handleSendMessagePrivate,
  handleSendTaskCommand,
  handleSendToDo,
  handleUndoMessage,
} from "./bot-manager/utilities.js";
import { handleBauCua } from "../service-dqt/game-service/bau-cua/bau-cua.js";
import { handleKBBCommand } from "../service-dqt/game-service/keobuabao/keobuabao.js";
import { handleAntiBadWordCommand } from "../service-dqt/anti-service/anti-badword.js";
import { handleChanLe } from "../service-dqt/game-service/chan-le/chan-le.js";
import {
  handleGetVoiceCommand,
  handleStoryCommand,
  handleTarrotCommand,
  handleVoiceCommand,
} from "../service-dqt/chat-zalo/chat-special/send-voice/send-voice.js";
import { handleMusicCommand } from "../service-dqt/api-crawl/music/soundcloud.js";
import { handleAntiNudeCommand } from "../service-dqt/anti-service/anti-nude/anti-nude.js";
import { handleSettingGroupCommand } from "./bot-manager/group-manage.js";
import { handleTopChartZingMp3, handleZingMp3Command } from "../service-dqt/api-crawl/music/zingmp3.js";
import { handleVietlott655Command } from "../service-dqt/game-service/vietlott/vietlott655.js";
import { startGame } from "../service-dqt/game-service/mini-game/index.js";
import { handleYoutubeCommand } from "../service-dqt/api-crawl/youtube/youtube-service.js";
import { handleJoinGroup, handleLeaveGroup, handleShowGroupsList } from "./bot-manager/remote-action-group.js";
import { handleNhacCuaTuiCommand } from "../service-dqt/api-crawl/music/nhaccuatui.js";
import { removeMention } from "../utils/format-util.js";
import { handleWhiteList } from "../service-dqt/anti-service/white-list.js";
import { handleAntiUndoCommand } from "../service-dqt/anti-service/anti-undo.js";
import { handleDownloadCommand } from "../service-dqt/api-crawl/api-hungdev/aio-downlink.js";
import { handleCapcutCommand } from "../service-dqt/api-crawl/capcut/capcut-service.js";
import { handleBankInfoCommand } from "../service-dqt/info-service/bank-info.js";
import { sendReactionWaitingCountdown } from "./manager-command/check-countdown.js";
import { getPermissionCommandName, handleSetCommandActive } from "./manager-command/set-command.js";
import { searchImageGoogle } from "../service-dqt/api-crawl/google/google-image.js";
import { scanGroupsWithAction } from "./bot-manager/scan-group.js";
import { handleDeleteMessage } from "./bot-manager/recent-message.js";
import { handleGoogleCommand } from "../service-dqt/api-crawl/google/google-search.js";
import { handleCommandStatusPost } from "../utils/canvas/status-post.js";
import { handleCreateQRCommand } from "../service-dqt/utilities/qr-creater.js";
import { handleScanQRCommand } from "../service-dqt/utilities/qr-scan.js";
import { handleSpeedTestCommand } from "../service-dqt/utilities/speedtest.js";
import { handleSendCustomerStickerVideo } from "../service-dqt/chat-zalo/chat-special/send-sticker/customer-sticker.js";
import { handleDeleteResource, handleDownloadResource } from "../service-dqt/utilities/download-resource.js";
import { handlePhatNguoiCommand } from "../service-dqt/api-crawl/content/phatnguoi.js";

const lastCommandUsage = {};

export const permissionLevels = {
  all: 0,
  adminBox: 1,
  adminBot: 2,
  adminLevelHigh: 3,
};

export function getCommand(command, commandConfig) {
  let commandConfigFinal = null;
  if (commandConfig) {
    commandConfigFinal = commandConfig;
  } else {
    commandConfigFinal = getCommandConfig().commands;
  }

  return commandConfigFinal.find((cmd) => cmd.name === command || (cmd.alias && cmd.alias.includes(command)));
}

async function checkPermission(api, message, commandName, userPermissionLevel, isNotify = true) {
  const commandConfig = getCommandConfig().commands;
  const command = getCommand(commandName, commandConfig);

  if (!command) {
    return true;
  }

  const requiredPermission = permissionLevels[command.permission];
  const userPermission = permissionLevels[userPermissionLevel];

  if (userPermission >= requiredPermission) {
    return true;
  }

  const permissionName = getPermissionCommandName(command);
  if (isNotify) {
    const caption = `Bạn Đéo có đủ quyền để sử dụng lệnh này\nYêu cầu quyền hạn: ${permissionName}`;
    await sendMessageInsufficientAuthority(api, message, caption);
  }
  return false;
}

export async function checkCommandCountdown(api, message, userId, commandName, commandUsage) {
  const commandConfig = getCommandConfig().commands;
  const command = getCommand(commandName, commandConfig);

  if (!command) {
    return true;
  }

  const currentTime = Date.now();
  const lastUsage = commandUsage[userId]?.[command.name] || 0;
  const countdown = command.countdown * 1000;

  if (currentTime - lastUsage < countdown) {
    const remainingTime = Math.ceil((countdown - (currentTime - lastUsage)) / 1000);
    await sendReactionWaitingCountdown(api, message, remainingTime, commandName);
    return false;
  }

  if (!commandUsage[userId]) {
    commandUsage[userId] = {};
  }
  commandUsage[userId][command.name] = currentTime;

  return true;
}

export async function sendReactionConfirmReceive(api, message, numHandleCommand) {
  if (numHandleCommand === 1 || numHandleCommand === 5) {
    await api.addReaction("OK", message);
  }
}

export function initGroupSettings(groupSettings, threadId, nameGroup) {
  const defaultSettings = {
    adminList: {},
    muteList: {},
    whileList: {},
    activeBot: false,
    activeGame: false,
    welcomeGroup: false,
    byeGroup: false,
    antiSpam: false,
    filterBadWords: false,
    removeLinks: false,
    learnEnabled: false,
    replyEnabled: false,
    onlyText: false,
    memberApprove: false,
    antiNude: false,
    whiteList: {},
  };

  if (!groupSettings[threadId]) {
    groupSettings[threadId] = { nameGroup: nameGroup };
  }

  Object.assign(
    groupSettings[threadId],
    Object.fromEntries(Object.entries(defaultSettings).filter(([key]) => !(key in groupSettings[threadId])))
  );

  if (!groupSettings[threadId].nameGroup || groupSettings[threadId].nameGroup != nameGroup) {
    groupSettings[threadId].nameGroup = nameGroup;
    writeGroupSettings(groupSettings);
  }
}

export async function checkAdminLevelHighest(api, message, isAdminLevelHighest) {
  if (!isAdminLevelHighest) {
    await sendMessageInsufficientAuthority(
      api,
      message,
      "Chỉ có quản trị viên cấp cao mới được sử dụng lệnh này!"
    );
    return false;
  }
  return true;
}

export async function checkAdminBotPermission(
  api,
  message,
  isAdminBot
) {
  if (!isAdminBot) {
    await sendMessageInsufficientAuthority(
      api,
      message,
      "Chỉ có quản trị viên bot mới được sử dụng lệnh này!"
    );
    return false;
  }
  return true;
}

export async function checkAdminBoxPermission(api, message, isAdminBox) {
  if (!isAdminBox) {
    await sendMessageInsufficientAuthority(
      api,
      message,
      "Chỉ có trưởng / phó cộng đồng hoặc quản trị bot mới được sử dụng lệnh này!"
    );
    return false;
  }
  return true;
}

function checkSpecialCommand(content, prefix) {
  const specialCommands = ["todo", "learnnow", "sendp"];
  return specialCommands.some((cmd) => content.startsWith(`${prefix}${cmd}`));
}

export async function handleCommandPrivate(api, message) {
  const threadId = message.threadId;
  const senderId = message.data.uidFrom;
  const content = message.data.content.trim();
  const prefix = getGlobalPrefix();
  const isAdminLevelHighest = isAdmin(senderId);

  if (typeof content === "string") {
    let command;
    let commandParts;

    // Kiểm tra xem có phải là lệnh prefix Đéo
    if (content.startsWith(`${prefix}prefix`) || content.startsWith(`prefix`)) {
      return await handlePrefixCommand(api, message, threadId, isAdminLevelHighest);
    }

    // Kiểm tra xem tin nhắn có bắt đầu bằng prefix Đéo
    if (!content.startsWith(prefix)) {
      return 1;
    }

    // Xử lý lệnh dịch đặc biệt
    if (checkSpecialCommand(content, prefix)) {
      commandParts = content.split("_");
      command = commandParts[0].slice(prefix.length).toLowerCase();
    } else {
      commandParts = content.slice(prefix.length).trim().split(/\s+/);
      command = commandParts[0].toLowerCase();
    }

    if (!(await checkCommandCountdown(api, message, senderId, `${prefix}${command}`, lastCommandUsage))) {
      return;
    }

    const isAdminBot = isAdmin(senderId, threadId);

    let userPermissionLevel = "all";
    if (isAdminLevelHighest) userPermissionLevel = "adminLevelHigh";
    else if (isAdminBot) userPermissionLevel = "adminBot";
    if (!(await checkPermission(api, message, command, userPermissionLevel))) {
      return;
    }

    const commandConfig = getCommandConfig().commands;
    const aliasCommand = command;
    const commandInfo = getCommand(command, commandConfig);
    command = commandInfo?.name || command;
    let numHandleCommand = commandInfo?.type || 99;

    if (numHandleCommand === 5) {
      if (managerData.data.onGamePrivate || isAdminLevelHighest) {
        switch (command) {
          case "game":
            await gameInfoCommand(api, message);
            return 0;
          case "login":
            await handleLoginPlayer(api, message);
            return 0;
          case "dangky":
            await handleRegisterPlayer(api, message);
            return 0;
          // case "logout":
          //   await handleLogoutPlayer(api, message);
          //   return 0;
          case "nap":
            await handleNapCommand(api, message);
            return 0;
          case "rut":
            await handleRutCommand(api, message);
            return 0;
          case "mycard":
            await handleMyCard(api, message);
            return 0;
          case "daily":
            await handleClaimDailyReward(api, message);
            return 0;
          case "rank":
            await handleTopPlayers(api, message);
            return 0;
          case "taixiu":
            if (commandParts[1] === "kq") {
              await handleTaiXiuCommand(api, message);
              return 0;
            }
            break;
          case "nongtrai":
            await handleNongTraiCommand(api, message);
            return 0;
        }
      } else {
        await sendMessageInsufficientAuthority(api, message, "Tương tác game trong tin nhắn riêng tư đã bị tắt!");
        return 0;
      }
    }

    if (numHandleCommand === 3) {
      switch (command) {
        case "bot":
          await handleActiveBotUser(api, message);
          return 0;
        case "buff":
          await handleBuffCommand(api, message);
          return 0;
        case "join":
          await handleJoinGroup(api, message);
          return 0;
        case "listgroups":
          await handleShowGroupsList(api, message, aliasCommand);
          return 0;
        case "todo":
          await handleSendToDo(api, message);
          return 0;
        case "blockbot":
          await handleBlockBot(api, message);
          return 0;
        case "unblockbot":
          await handleUnblockBot(api, message);
          return 0;
        case "alias":
          await handleAliasCommand(api, message, commandParts);
          return 0;
        case "setcmd":
          await handleSetCommandActive(api, message, commandParts);
          return 0;
        case "downloadresource":
          await handleDownloadResource(api, message, aliasCommand);
          return 0;
        case "deleteresource":
          await handleDeleteResource(api, message, aliasCommand);
          return 0;
      }
    }

    if (numHandleCommand === 1) {
      if (managerData.data.onBotPrivate || isAdminLevelHighest) {
        await sendReactionConfirmReceive(api, message, numHandleCommand);
        switch (command) {
          case "command":
            await listCommands(api, message, commandParts.slice(1));
            return 0;
          case "detail":
            await getBotDetails(api, message);
            return 0;
          case "speedtest":
            await handleSpeedTestCommand(api, message);
            return 0;
          case "info":
            await userInfoCommand(api, message, aliasCommand);
            return 0;
          case "card":
            await userBussinessCardCommand(api, message, aliasCommand);
            return 0;
          case "help":
            await helpCommand(api, message);
            return 0;
          case "gpt":
            await askGPTCommand(api, message, aliasCommand);
            return 0;
          case "gemini":
            await askGeminiCommand(api, message, aliasCommand);
            return 0;
          case "thoitiet":
            await weatherCommand(api, message);
            return 0;
          case "dich":
            await translateCommand(api, message);
            return 0;
          case "girl":
            await sendImage(api, message, "girl");
            return 0;
          case "boy":
            await sendImage(api, message, "boy");
            return 0;
          case "cosplay":
            await sendImage(api, message, "cosplay");
            return 0;
          case "anime":
            await sendImage(api, message, "anime");
            return 0;
          case "gif":
            await sendGifRemote(api, message);
            return 0;
          case "google":
            await handleGoogleCommand(api, message, aliasCommand);
            return 0;
          case "pinterest":
            await searchImagePinterest(api, message, aliasCommand);
            return 0;
          case "image":
            await searchImageGoogle(api, message, aliasCommand);
            return 0;
          case "vdboy":
            await handleVideoCommand(api, message, "boy");
            return 0;
          case "vdgirl":
            await handleVideoCommand(api, message, "girl");
            return 0;
          case "vdcos":
            await handleVideoCommand(api, message, "cosplay");
            return 0;
          case "vdsexy":
            await handleVideoCommand(api, message, "sexy");
            return 0;
          case "vdanime":
            await handleVideoCommand(api, message, "anime");
            return 0;
          case "vdchill":
            await handleVideoCommand(api, message, "chill");
            return 0;
          case "sticker":
            await handleStickerCommand(api, message);
            return 0;
          case "voice":
            await handleVoiceCommand(api, message, aliasCommand);
            return 0;
          case "truyencuoi":
            await handleStoryCommand(api, message);
            return 0;
          case "tarrot":
            await handleTarrotCommand(api, message);
            return 0;
          case "soundcloud":
            await handleMusicCommand(api, message, aliasCommand);
            return 0;
          case "zingmp3":
            await handleZingMp3Command(api, message, aliasCommand);
            return 0;
          case "zingchart":
            await handleTopChartZingMp3(api, message);
            return 0;
          case "nhaccuatui":
            await handleNhacCuaTuiCommand(api, message, aliasCommand);
            return 0;
          case "tiktok":
            await handleTikTokCommand(api, message, aliasCommand);
            return 0;
          case "youtube":
            await handleYoutubeCommand(api, message, aliasCommand);
            return 0;
          case "capcut":
            await handleCapcutCommand(api, message, aliasCommand);
            return 0;
          case "download":
            await handleDownloadCommand(api, message, aliasCommand);
            return 0;
          case "getlink":
            await handleGetLinkInQuote(api, message);
            return 0;
          case "getvoice":
            await handleGetVoiceCommand(api, message, aliasCommand);
            return 0;
          case "qrbank":
            await handleBankInfoCommand(api, message, aliasCommand);
            return 0;
          case "poststatus":
            await handleCommandStatusPost(api, message, aliasCommand);
            return 0;
          case "scanqr":
            await handleScanQRCommand(api, message, aliasCommand);
            return 0;
          case "stickercustom":
            await handleSendCustomerStickerVideo(api, message, aliasCommand);
            return 0;
          case "createqr":
            await handleCreateQRCommand(api, message, aliasCommand);
            return 0;
          case "phatnguoi":
            await handlePhatNguoiCommand(api, message, aliasCommand);
            return 0;
        }
      } else {
        await sendMessageInsufficientAuthority(api, message, "Tương tác lệnh trong tin nhắn riêng tư đã bị tắt!");
        return 0;
      }
    }

    if (numHandleCommand === 99) {
      await checkNotFindCommand(api, message, command, commandConfig);
    } else {
      await sendMessageInsufficientAuthority(api, message, "Lệnh chỉ áp dụng đối với nhóm hoặc cộng đồng!");
    }
    return 0;
  }

  return 1;
}

export async function handleCommand(
  api,
  message,
  groupInfo,
  groupAdmins,
  groupSettings,
  isAdminLevelHighest,
  isAdminBot,
  isAdminBox,
  handleChat
) {
  const threadId = message.threadId;
  const senderId = message.data.uidFrom;
  let content = removeMention(message);
  const prefix = getGlobalPrefix();
  let numHandleCommand = -1;

  if ((content.startsWith(`${prefix}prefix`) || content.startsWith(`prefix`)) && isAdminBot) {
    return await handlePrefixCommand(api, message, threadId, isAdminLevelHighest);
  }

  if (!content.startsWith(prefix)) {
    return numHandleCommand;
  }

  let commandParts;
  let command;

  if (checkSpecialCommand(content, prefix)) {
    commandParts = content.split("_");
    command = commandParts[0].slice(prefix.length).toLowerCase();
  } else {
    commandParts = content.slice(prefix.length).trim().split(/\s+/);
    command = commandParts[0].toLowerCase();
  }

  if (!handleChat) return;
  const commandConfig = getCommandConfig().commands;
  let isChangeSetting = false;
  numHandleCommand = 99;

  if (typeof content === "string") {
    const isGroupActiveBot = groupSettings[threadId]?.activeBot === true;
    if (!isAdminLevelHighest && !(await checkCommandCountdown(api, message, senderId, command, lastCommandUsage))) {
      return numHandleCommand;
    }

    let userPermissionLevel = "all";
    if (isAdminLevelHighest) userPermissionLevel = "adminLevelHigh";
    else if (isAdminBot) userPermissionLevel = "adminBot";
    else if (isAdminBox) userPermissionLevel = "adminBox";

    if (!(await checkPermission(api, message, command, userPermissionLevel, isGroupActiveBot || isAdminBot))) {
      return numHandleCommand;
    }

    const aliasCommand = command;
    const commandInfo = getCommand(command, commandConfig);
    const activeCommand = commandInfo ? commandInfo.active : true;
    if (!isAdminLevelHighest && (aliasCommand != "" && !activeCommand)) {
      return numHandleCommand;
    }
    numHandleCommand = commandInfo?.type || 99;
    command = commandInfo?.name || command;

    switch (command) {
      case "add":
      case "remove":
        await handleAdminHighLevelCommands(api, message, groupAdmins, groupSettings, isAdminLevelHighest);
        break;

      case "listadmin":
        await handleListAdmin(api, message, groupSettings);
        break;

      case "bot":
        isChangeSetting = await handleActiveBotUser(api, message, groupSettings);
        break;

      case "join":
        await handleJoinGroup(api, message);
        break;

      case "leave":
        await handleLeaveGroup(api, message);
        break;

      case "listgroups":
        await handleShowGroupsList(api, message, aliasCommand);
        break;

      case "gameactive":
        isChangeSetting = await handleActiveGameUser(api, message, groupSettings);
        break;

      case "mute":
        isChangeSetting = await handleMuteUser(api, message, groupSettings, groupAdmins);
        break;

      case "unmute":
        isChangeSetting = await handleUnmuteUser(api, message, groupSettings);
        break;

      case "listmute":
        await handleMuteList(api, message, groupSettings);
        break;

      case "sendtask":
        isChangeSetting = await handleSendTaskCommand(api, message, groupSettings);
        break;

      case "welcome":
      case "bye":
        isChangeSetting = await handleWelcomeBye(api, message, groupSettings);
        break;

      case "kick":
        await handleKick(api, message, groupInfo);
        break;

      case "block":
        await handleBlock(api, message, groupInfo);
        break;

      case "manager":
        await adminCommand(api, message);
        break;

      case "tagall":
        await chatAll(api, message, groupInfo, aliasCommand);
        break;

      case "learn":
      case "learnnow":
      case "unlearn":
        isChangeSetting = await handleLearnCommand(api, message, groupSettings);
        break;

      case "reply":
        isChangeSetting = await handleReplyCommand(api, message, groupSettings);
        break;

      case "onlytext":
        isChangeSetting = await handleOnlyText(api, message, groupSettings);
        break;

      case "scold":
        await scoldUser(api, message);
        break;

      case "antilink":
        isChangeSetting = await handleAntiLinkCommand(api, message, groupSettings);
        break;

      case "antispam":
        isChangeSetting = await handleAntiSpamCommand(api, message, groupSettings);
        break;

      case "antibadword":
        isChangeSetting = await handleAntiBadWordCommand(api, message, groupSettings);
        break;

      case "approve":
        isChangeSetting = await handleApprove(api, message, groupSettings);
        break;

      case "keygold":
      case "keysilver":
      case "unkey":
        if (!(await checkAdminLevelHighest(api, message, isAdminLevelHighest))) return;
        isChangeSetting = await handleKeyCommands(api, message, groupSettings, isAdminLevelHighest);
        break;

      case "changelink":
        await handleChangeGroupLink(api, message);
        break;

      case "undo":
        await handleUndoMessage(api, message);
        break;

      case "todo":
        await handleSendToDo(api, message);
        break;

      case "sendp":
        await handleSendMessagePrivate(api, message);
        break;

      case "buff":
        await handleBuffCommand(api, message, groupSettings);
        break;

      case "ban":
        await handleBanCommand(api, message, groupSettings);
        break;

      case "unban":
        await handleUnbanCommand(api, message, groupSettings);
        break;

      case "blockbot":
        await handleBlockBot(api, message, groupSettings);
        break;

      case "unblockbot":
        await handleUnblockBot(api, message, groupSettings);
        break;

      case "listblockbot":
        await handleListBlockBot(api, message);
        break;

      case "alias":
        await handleAliasCommand(api, message, commandParts);
        break;

      case "antinude":
        isChangeSetting = await handleAntiNudeCommand(api, message, groupSettings);
        break;

      case "antiundo":
        isChangeSetting = await handleAntiUndoCommand(api, message, groupSettings);
        break;

      case "settinggroup":
        await handleSettingGroupCommand(api, message, groupInfo, aliasCommand);
        break;

      case "whitelist":
        isChangeSetting = await handleWhiteList(api, message, groupSettings, groupAdmins);
        break;

      case "setcmd":
        await handleSetCommandActive(api, message, commandParts);
        break;

      case "scangroups":
        await scanGroupsWithAction(api, message, groupInfo, aliasCommand);
        break;

      case "deletemessage":
        await handleDeleteMessage(api, message, groupAdmins, aliasCommand);
        break;

      case "downloadresource":
        await handleDownloadResource(api, message, aliasCommand);
        break;

      case "deleteresource":
        await handleDeleteResource(api, message, aliasCommand);
        break;

      default:
        if (numHandleCommand === 1) {
          if (isAdminLevelHighest || groupSettings[threadId].activeBot === true) {
            await sendReactionConfirmReceive(api, message, numHandleCommand);
            switch (command) {
              case "command":
                await listCommands(api, message, commandParts.slice(1));
                break;

              case "group":
                await groupInfoCommand(api, message);
                break;

              case "detail":
                await getBotDetails(api, message, groupSettings);
                break;

              case "speedtest":
                await handleSpeedTestCommand(api, message);
                break;

              case "info":
                await userInfoCommand(api, message, aliasCommand);
                break;

              case "card":
                await userBussinessCardCommand(api, message, aliasCommand);
                break;

              case "help":
                await helpCommand(api, message, groupAdmins);
                break;

              case "gpt":
                await askGPTCommand(api, message, aliasCommand);
                break;

              case "gemini":
                await askGeminiCommand(api, message, aliasCommand);
                break;

              case "thoitiet":
                await weatherCommand(api, message);
                break;

              case "topchat":
                await handleRankCommand(api, message);
                break;

              case "simsimi":
                await chatWithSimsimi(api, message);
                break;

              case "dich":
                await translateCommand(api, message);
                break;

              case "girl":
                await sendImage(api, message, "girl");
                break;

              case "boy":
                await sendImage(api, message, "boy");
                break;

              case "cosplay":
                await sendImage(api, message, "cosplay");
                break;

              case "anime":
                await sendImage(api, message, "anime");
                break;

              case "gif":
                await sendGifRemote(api, message);
                break;

              case "google":
                await handleGoogleCommand(api, message, aliasCommand);
                break;

              case "pinterest":
                await searchImagePinterest(api, message, aliasCommand);
                break;

              case "image":
                await searchImageGoogle(api, message, aliasCommand);
                break;

              case "vdboy":
                await handleVideoCommand(api, message, "boy");
                break;

              case "vdgirl":
                await handleVideoCommand(api, message, "girl");
                break;

              case "vdcos":
                await handleVideoCommand(api, message, "cosplay");
                break;

              case "vdsexy":
                await handleVideoCommand(api, message, "sexy");
                break;

              case "vdanime":
                await handleVideoCommand(api, message, "anime");
                break;

              case "vdchill":
                await handleVideoCommand(api, message, "chill");
                break;

              case "sticker":
                await handleStickerCommand(api, message);
                break;

              case "voice":
                await handleVoiceCommand(api, message, aliasCommand);
                break;

              case "truyencuoi":
                await handleStoryCommand(api, message);
                break;

              case "tarrot":
                await handleTarrotCommand(api, message);
                break;

              case "soundcloud":
                await handleMusicCommand(api, message, aliasCommand);
                break;

              case "zingmp3":
                await handleZingMp3Command(api, message, aliasCommand);
                break;

              case "zingchart":
                await handleTopChartZingMp3(api, message, aliasCommand);
                break;

              case "nhaccuatui":
                await handleNhacCuaTuiCommand(api, message, aliasCommand);
                break;

              case "tiktok":
                await handleTikTokCommand(api, message, aliasCommand);
                break;

              case "youtube":
                await handleYoutubeCommand(api, message, aliasCommand);
                break;

              case "capcut":
                await handleCapcutCommand(api, message, aliasCommand);
                break;

              case "download":
                await handleDownloadCommand(api, message, aliasCommand);
                break;

              case "getlink":
                await handleGetLinkInQuote(api, message);
                break;

              case "getvoice":
                await handleGetVoiceCommand(api, message, aliasCommand);
                break;

              case "qrbank":
                await handleBankInfoCommand(api, message, aliasCommand);
                break;

              case "poststatus":
                await handleCommandStatusPost(api, message, aliasCommand);
                break;

              case "createqr":
                await handleCreateQRCommand(api, message, aliasCommand);
                break;

              case "scanqr":
                await handleScanQRCommand(api, message, aliasCommand);
                break;

              case "stickercustom":
                await handleSendCustomerStickerVideo(api, message, aliasCommand);
                break;

              case "phatnguoi":
                await handlePhatNguoiCommand(api, message, aliasCommand);
                break;
            }
          } else {
            if (isAdminBot) {
              let text = `Tính năng \"Tương Tác Thành Viên\" chưa được bật trong nhóm này.\n\n` +
                `Quản trị viên hãy dùng lệnh !bot để bật tương tác cho nhóm!`;
              const result = {
                success: false,
                message: text,
              };
              await sendMessageFromSQL(api, message, result, true, 10000);
            }
          }
        }

        // Khu Vực Xử Lý Lệnh Game
        if (numHandleCommand === 5) {
          switch (command) {
            case "game":
              await gameInfoCommand(api, message, groupSettings);
              break;

            case "login":
              await handleLoginPlayer(api, message, groupSettings);
              break;

            case "dk":
            case "dangky":
              await handleRegisterPlayer(api, message, groupSettings);
              break;

            // case "logout":
            //   await handleLogoutPlayer(api, message, groupSettings);
            //   break;

            case "nap":
              await handleNapCommand(api, message, groupSettings);
              break;

            case "rut":
              await handleRutCommand(api, message, groupSettings);
              break;

            case "bank":
              await handleBankCommand(api, message, groupSettings);
              break;

            case "mycard":
              await handleMyCard(api, message, groupSettings);
              break;

            case "daily":
              await handleClaimDailyReward(api, message, groupSettings);
              break;

            case "rank":
              await handleTopPlayers(api, message, groupSettings);
              break;

            case "doanso":
              await startGame(api, message, groupSettings, "guessNumber", commandParts.slice(1), isAdminBox);
              break;

            case "noitu":
              await startGame(api, message, groupSettings, "wordChain", commandParts.slice(1), isAdminBox);
              break;

            case "doantu":
              await startGame(api, message, groupSettings, "wordGuess", commandParts.slice(1), isAdminBox);
              break;

            case "baucua":
              await handleBauCua(api, message, groupSettings);
              break;

            case "taixiu":
              await handleTaiXiuCommand(api, message, groupSettings);
              break;

            case "chanle":
              await handleChanLe(api, message, groupSettings);
              break;

            case "keobuabao":
              await handleKBBCommand(api, message, groupSettings);
              break;

            case "ntr":
            case "nongtrai":
            case "mybag":
              await handleNongTraiCommand(api, message, groupSettings);
              break;

            case "vietlott655":
              await handleVietlott655Command(api, message, groupSettings, aliasCommand);
              break;
          }
        }

        if (numHandleCommand === 99 && (groupSettings[threadId].activeBot === true || isAdminBot)) {
          await checkNotFindCommand(api, message, command, commandConfig);
        }
        break;
    }
  }

  if (isChangeSetting) {
    writeGroupSettings(groupSettings);
  }

  return numHandleCommand;
}
