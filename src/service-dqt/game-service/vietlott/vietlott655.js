import chalk from "chalk";
import { MultiMsgStyle, MessageStyle, MessageType } from "../../../api-zalo/index.js";
import { isAdmin } from "../../../index.js";
import { updatePlayerBalance, getPlayerBalance, updatePlayerBalanceByUsername, setLoserGameByUsername } from "../../../database/player.js";
import { sendMessageFromSQL, sendMessageImageNotQuote } from "../../chat-zalo/chat-style/chat-style.js";
import { nameServer } from "../../../database/index.js";
import schedule from "node-schedule";
import { parseGameAmount, formatCurrency } from "../../../utils/format-util.js";
import { getGlobalPrefix } from "../../service.js";
import Big from "big.js";
import { checkBeforeJoinGame } from "../index.js";
import { createVietlott655ResultImage, createVietlott655WaitingImage } from "../../../utils/canvas/game.js";
import { clearImagePath } from "../../../utils/canvas/index.js";
import { formatSeconds } from "../../../utils/format-util.js";
import { getUsernameByIdZalo } from "../../../database/player.js";
import { gameState } from "../game-manager.js";

const DEFAULT_INTERVAL = 60; // 60 giây
const MAX_INTERVAL = 3600; // 1 giờ
const TIME_SEND_UPDATE = 10000; // 10 giây
const MAX_HISTORY = 20;
const TTL_IMAGE = 10800000;

// Tỉ lệ thưởng cho các giải
const PRIZE_RATIOS = {
  JACKPOT: 3000000, // x3000000 (30 tỷ/10k)
  JACKPOT2: 300000, // x300000 (3 tỷ/10k)
  FIRST: 4000, // x4000 (40tr/10k)
  SECOND: 50, // x50 (500k/10k)
  THIRD: 5, // x5 (50k/10k)
};

let currentSession = {
  players: {},
  startTime: Date.now(),
  endTime: Date.now() + MAX_INTERVAL * 1000,
  interval: MAX_INTERVAL,
};
let activeThreads = new Set();
let gameJob;
let isEndingGame = false;
let jackpot = new Big(1000000);
let forcedResult = null;
let gameHistory = [];

export function setForcedResult(numbers) {
  // Kiểm tra tính hợp lệ của numbers
  if (!Array.isArray(numbers) || numbers.length !== 7) {
    throw new Error("Kết quả Đéo hợp lệ. Cần 6 số chính và 1 số phụ.");
  }

  const mainNumbers = numbers.slice(0, 6);
  const extraNumber = numbers[6];

  // Kiểm tra các số có hợp lệ Đéo
  if (mainNumbers.some((num) => num < 1 || num > 55) || extraNumber < 1 || extraNumber > 55) {
    throw new Error("Các số phải nằm trong khoảng 1-55");
  }

  // Kiểm tra Đéo trùng nhau
  const uniqueNumbers = new Set([...mainNumbers, extraNumber]);
  if (uniqueNumbers.size !== 7) {
    throw new Error("Các số Đéo được trùng nhau");
  }

  forcedResult = {
    mainNumbers: mainNumbers.sort((a, b) => a - b),
    extraNumber,
  };

  return forcedResult;
}

function saveGameData() {
  gameState.changes.vietlott655 = true;
}

// Hàm tạo số ngẫu nhiên từ 1-55
function generateRandomNumber() {
  return Math.floor(Math.random() * 55) + 1;
}

// Hàm tạo 6 số chính và 1 số phụ Đéo trùng nhau
function generateWinningNumbers() {
  if (forcedResult) {
    const result = forcedResult;
    forcedResult = null;
    return result;
  }

  const numbers = new Set();
  while (numbers.size < 6) {
    numbers.add(generateRandomNumber());
  }
  let extraNumber;
  do {
    extraNumber = generateRandomNumber();
  } while (numbers.has(extraNumber));

  return {
    mainNumbers: Array.from(numbers).sort((a, b) => a - b),
    extraNumber,
  };
}

// Hàm kiểm tra số trúng và tính tiền thưởng
function calculatePrize(playerNumbers, winningNumbers, betAmount) {
  const { mainNumbers, extraNumber } = winningNumbers;
  const matches = playerNumbers.filter((num) => mainNumbers.includes(num)).length;
  const hasExtraMatch = playerNumbers.includes(extraNumber);

  let prize = new Big(0);
  const bet = new Big(betAmount);

  if (matches === 6) {
    // Jackpot
    prize = bet.mul(PRIZE_RATIOS.JACKPOT).plus(jackpot);
    jackpot = new Big(1000000); // Reset jackpot
  } else if (matches === 5 && hasExtraMatch) {
    // Jackpot 2
    prize = bet.mul(PRIZE_RATIOS.JACKPOT2);
  } else if (matches === 5) {
    // Giải nhất
    prize = bet.mul(PRIZE_RATIOS.FIRST);
  } else if (matches === 4) {
    // Giải nhì
    prize = bet.mul(PRIZE_RATIOS.SECOND);
  } else if (matches === 3) {
    // Giải ba
    prize = bet.mul(PRIZE_RATIOS.THIRD);
  }

  // Kiểm tra số tiền thưởng hợp lệ
  if (prize.lt(0) || prize.eq(0)) {
    prize = new Big(0);
  }

  return {
    matches,
    hasExtraMatch,
    prize: prize.round(0, Big.roundDown) // Làm tròn xuống để tránh số lẻ
  };
}

// Hàm xử lý kết thúc phiên
async function endGame(api) {
  const winningNumbers = generateWinningNumbers();
  
  // Thêm kết quả mới vào đầu mảng history
  const newResult = {
    mainNumbers: winningNumbers.mainNumbers,
    extraNumber: winningNumbers.extraNumber,
    timestamp: Date.now()
  };
  
  gameHistory.unshift(newResult);
  if (gameHistory.length > MAX_HISTORY) {
    gameHistory = gameHistory.slice(0, MAX_HISTORY);
  }

  let resultText = `${nameServer}\n🎲 KẾT QUẢ VIETLOTT 6/55 🎲\n`;
  resultText += `Số trúng thưởng: ${winningNumbers.mainNumbers.join(" - ")}\n`;
  resultText += `Số phụ: ${winningNumbers.extraNumber}\n\n`;

  let mentions = [];
  let mentionPos = resultText.length;
  let hasJackpotWinner = false;
  let threadPlayers = {}; // Thêm object để theo dõi người chơi theo nhóm

  // Xử lý kết quả cho từng người chơi
  for (const [playerId, player] of Object.entries(currentSession.players)) {
    let playerTotalWin = new Big(0);
    let playerResults = [];

    // Xử lý từng lượt cược của người chơi
    for (const bet of player.bets) {
      const result = calculatePrize(bet.numbers, winningNumbers, bet.amount);
      
      if (result.prize.gt(0)) {
        // Người chơi thắng
        playerTotalWin = playerTotalWin.plus(result.prize);
        playerResults.push({
          numbers: bet.numbers.join(" - "),
          matches: result.matches,
          hasExtraMatch: result.hasExtraMatch,
          win: result.prize,
          isWin: true
        });
        hasJackpotWinner = hasJackpotWinner || result.matches === 6;
      } else {
        // Người chơi thua
        const betAmountBig = new Big(bet.amount);
        jackpot = jackpot.plus(betAmountBig.mul(0.6));
        playerResults.push({
          numbers: bet.numbers.join(" - "),
          matches: result.matches,
          hasExtraMatch: result.hasExtraMatch,
          loss: bet.amount,
          isWin: false
        });
      }
    }

    // Tạo thông báo kết quả cho người chơi
    let playerText = `@${player.playerName}:\n`;
    playerResults.forEach((result, index) => {
      playerText += `Lượt ${index + 1}: ${result.numbers}\n`;
      if (result.isWin) {
        playerText += `Trúng ${result.matches} số`;
        if (result.hasExtraMatch) playerText += ` và số phụ`;
        playerText += `\nThắng: +${formatCurrency(result.win)} VNĐ 🎉\n`;
      } else {
        playerText += `Đéo trúng giải\nThua: -${formatCurrency(result.loss)} VNĐ 😢\n`;
      }
    });

    if (playerTotalWin.gt(0)) {
      try {
        await updatePlayerBalanceByUsername(player.username, playerTotalWin.toNumber(), true);
        playerText += `\nTổng thắng: +${formatCurrency(playerTotalWin)} VNĐ 🎯\n`;
      } catch (error) {
        console.error("Lỗi khi cập nhật tiền thắng:", error);
        playerText += `\nLỗi cập nhật tiền thắng, vui lòng liên hệ admin!\n`;
      }
    }

    resultText += playerText + "\n";

    // Thêm mention cho người chơi
    mentions.push({
      len: player.playerName.length + 1,
      uid: playerId,
      pos: mentionPos
    });
    mentionPos = resultText.length;

    // Thêm người chơi vào danh sách theo nhóm
    if (!threadPlayers[player.threadId]) {
      threadPlayers[player.threadId] = [];
    }
    threadPlayers[player.threadId].push(playerId);
  }

  resultText += `\nHũ hiện tại: ${formatCurrency(jackpot)} VNĐ 💰`;

  gameState.data.vietlott655.history = gameHistory;
  gameState.data.vietlott655.jackpot = jackpot.toString();
  saveGameData();

  // Tạo ảnh kết quả
  const resultImagePath = await createVietlott655ResultImage(
    winningNumbers.mainNumbers,
    winningNumbers.extraNumber,
    hasJackpotWinner
  );

  // Gửi kết quả cho từng nhóm với mentions phù hợp
  for (const threadId of activeThreads) {
    if (threadPlayers[threadId] && threadPlayers[threadId].length > 0) {
      // Lọc mentions chỉ cho người chơi trong nhóm này
      const threadMentions = mentions.filter(mention => 
        threadPlayers[threadId].includes(mention.uid)
      );

      await api.sendMessage(
        {
          msg: resultText,
          mentions: threadMentions,
          attachments: [resultImagePath],
          isUseProphylactic: true,
          ttl: TTL_IMAGE,
        },
        threadId,
        MessageType.GroupMessage
      );
    }
  }

  await clearImagePath(resultImagePath);

  // Reset phiên mới
  gameState.data.vietlott655.players = {};
  saveGameData();

  currentSession = {
    players: {},
    startTime: Date.now(),
    endTime: Date.now() + MAX_INTERVAL * 1000,
    interval: MAX_INTERVAL
  };

  if (gameJob) {
    gameJob.cancel();
  }
  gameJob = schedule.scheduleJob("* * * * * *", () => runGameLoop(api));
}

// Hàm xử lý đặt cược
async function placeBet(api, message, threadId, senderId, amount, numbers) {
  const username = await getUsernameByIdZalo(senderId);
  if (!username) {
    await sendMessageFromSQL(api, message, {
      success: false,
      message: "Đéo tìm thấy thông tin tài khoản.",
    });
    return;
  }

  // Kiểm tra số tiền cược
  const balanceResult = await getPlayerBalance(senderId);
  if (!balanceResult.success) {
    await sendMessageFromSQL(api, message, {
      success: false,
      message: "Đéo thể lấy thông tin số dư.",
    });
    return;
  }

  let betAmount;
  try {
    const parsedAmount = parseGameAmount(amount, balanceResult.balance);
    if (parsedAmount === 'allin') {
      betAmount = new Big(balanceResult.balance);
    } else {
      betAmount = parsedAmount;
    }

    if (betAmount.lt(10000)) {
      await sendMessageFromSQL(api, message, {
        success: false,
        message: "Số tiền cược tối thiểu là 10,000 VNĐ",
      });
      return;
    }

    if (betAmount.gt(balanceResult.balance)) {
      await sendMessageFromSQL(api, message, {
        success: false,
        message: `Số dư Đéo đủ. Bạn chỉ có ${formatCurrency(new Big(balanceResult.balance))} VNĐ`,
      });
      return;
    }
  } catch (error) {
    await sendMessageFromSQL(api, message, {
      success: false,
      message: error.message,
    });
    return;
  }

  // Xử lý số đặt
  let playerNumbers;
  if (numbers === "random") {
    const randomNums = new Set();
    while (randomNums.size < 6) {
      randomNums.add(generateRandomNumber());
    }
    playerNumbers = Array.from(randomNums).sort((a, b) => a - b);
  } else {
    playerNumbers = numbers.split(" ").map((num) => parseInt(num));

    // Kiểm tra tính hợp lệ của các số
    if (playerNumbers.length !== 6 || playerNumbers.some((num) => isNaN(num) || num < 1 || num > 55) || new Set(playerNumbers).size !== 6) {
      await sendMessageFromSQL(api, message, {
        success: false,
        message: "Vui lòng nhập 6 số khác nhau từ 1-55",
      });
      return;
    }
  }

  // Khởi tạo mảng bets nếu chưa có
  if (!currentSession.players[senderId]) {
    currentSession.players[senderId] = {
      bets: [],
      playerName: message.data.dName || senderId,
      threadId,
      username
    };
  }

  // Thêm lượt cược mới vào mảng
  currentSession.players[senderId].bets.push({
    numbers: playerNumbers,
    amount: betAmount
  });

  if (!gameState.data.vietlott655) gameState.data.vietlott655 = { players: {} };
  gameState.data.vietlott655.players = currentSession.players;
  saveGameData();

  // Trừ tiền cược
  await updatePlayerBalanceByUsername(username, betAmount.neg().toNumber());

  await sendMessageFromSQL(api, message, {
    success: true,
    message: `Đặt cược thành công!\nSố đã chọn: ${playerNumbers.join(" - ")}\nSố tiền: ${formatCurrency(betAmount)} VNĐ\nTổng số lượt đặt: ${currentSession.players[senderId].bets.length}`,
  }, true, 60000);

  // Cập nhật thời gian phiên khi có người chơi đầu tiên
  if (Object.keys(currentSession.players).length === 1 && currentSession.players[senderId].bets.length === 1) {
    currentSession.interval = DEFAULT_INTERVAL;
    currentSession.endTime = Date.now() + DEFAULT_INTERVAL * 1000;
  }
}

export async function handleVietlott655Command(api, message, groupSettings, aliasCommand) {
  if (!(await checkBeforeJoinGame(api, message, groupSettings, true))) return;

  const senderId = message.data.uidFrom;
  const threadId = message.threadId;
  const content = message.data.content.trim().toLowerCase();
  const prefix = getGlobalPrefix();
  const commandParts = content.split(" ");

  // Thêm xử lý lệnh lichsu
  if (commandParts[1] === "lichsu") {
    await handleHistory(api, message, threadId);
    return;
  }

  // Xử lý lệnh start/close cho admin
  if (commandParts[1] === "start" || commandParts[1] === "close") {
    if (!isAdmin(senderId, threadId)) {
      await sendMessageFromSQL(api, message, {
        success: false,
        message: "Bạn Đéo có quyền sử dụng lệnh này.",
      });
      return;
    }
    await toggleThreadParticipation(api, message, threadId, commandParts[1] === "start");
    return;
  }

  // Thêm xử lý lệnh kq cho admin
  if (commandParts[1] === "kq") {
    if (isAdmin(senderId)) {
      try {
        // Format: !vl655 kq 1 2 3 4 5 6 7 (7 số)
        const numbers = commandParts.slice(2).map((num) => parseInt(num));
        const result = setForcedResult(numbers);

        const detailedResult = `Đã set kết quả Vietlott 6/55 cho phiên tiếp theo:
Số chính: ${result.mainNumbers.join(" - ")}
Số phụ: ${result.extraNumber}`;

        await api.sendMessage({ msg: detailedResult }, threadId, MessageType.DirectMessage);
      } catch (error) {
        await api.sendMessage({ msg: `Có lỗi xảy ra khi set kết quả: ${error.message}` }, threadId, MessageType.DirectMessage);
      }
      return;
    }
  }

  // Kiểm tra cú pháp lệnh
  const betRegex = new RegExp(
    `^${prefix}(${aliasCommand})\\s+(\\d+|all|\\d+%|\\d+k|\\d+m|\\d+b|\\d+kb|\\d+bb)\\s+(random|(?:\\d+\\s+){5}\\d+)$`,
    "i"
  );
  const betMatch = content.match(betRegex);

  if (betMatch) {
    const amount = betMatch[2];
    const numbers = betMatch[3];
    await placeBet(api, message, threadId, senderId, amount, numbers);
  } else {
    await sendMessageFromSQL(api, message, {
      success: false,
        message: `${nameServer}\n` +
        `🎮 HƯỚNG DẪN ${aliasCommand.toUpperCase()} 6/55 🎮\n\n` +
        "Cách chơi:\n" +
        "- Chọn 6 số từ 1 đến 55 hoặc để hệ thống chọn ngẫu nhiên\n" +
        "- Đặt cược tối thiểu 10,000 VNĐ\n\n" +
        "Cơ cấu giải thưởng:\n" +
        `- Jackpot (6 số): x${PRIZE_RATIOS.JACKPOT} + Hũ\n` +
        `- Jackpot 2 (5 số + số phụ): x${PRIZE_RATIOS.JACKPOT2}\n` +
        `- Giải Nhất (5 số): x${PRIZE_RATIOS.FIRST}\n` +
        `- Giải Nhì (4 số): x${PRIZE_RATIOS.SECOND}\n` +
        `- Giải Ba (3 số): x${PRIZE_RATIOS.THIRD}\n\n` +
        "Cú pháp đặt cược:\n" +
        `!${aliasCommand} <tiền cược> <random hoặc 6 số>\n` +
        "Ví dụ:\n" +
        `!${aliasCommand} 10000 random\n` +
        `!${aliasCommand} 10k 1 15 22 33 44 55\n\n` +
        "Các lệnh khác:\n" +
        `!${aliasCommand} lichsu - Xem lịch sử kết quả\n` +
        "💰 60% tiền thua sẽ được cộng vào hũ"
    }, false, 120000);
  }
}

async function runGameLoop(api) {
  if (!currentSession || isEndingGame) return;

  try {
    const currentTime = Date.now();
    const remainingTime = Math.max(0, currentSession.endTime - currentTime);
    const remainingSeconds = Math.ceil(remainingTime / 1000);

    if (remainingSeconds === 0 && !isEndingGame) {
      isEndingGame = true;
      await endGame(api);
      isEndingGame = false;
    } else if (remainingSeconds % (TIME_SEND_UPDATE / 1000) === 0 && Object.keys(currentSession.players).length > 0) {
      await sendGameUpdate(api, remainingSeconds);
    }
  } catch (error) {
    console.error("Lỗi khi update Vietlott 6/55:", error);
  }
}

export async function initializeGameVietlott655(api) {
  if (!gameState.data.vietlott655) gameState.data.vietlott655 = {};
  if (!gameState.data.vietlott655.activeThreads) gameState.data.vietlott655.activeThreads = [];
  if (!gameState.data.vietlott655.jackpot) gameState.data.vietlott655.jackpot = "1000000";
  if (!gameState.data.vietlott655.history) gameState.data.vietlott655.history = [];
  if (!gameState.data.vietlott655.players) gameState.data.vietlott655.players = {};
  gameState.data.vietlott655.jackpot = new Big(gameState.data.vietlott655.jackpot);

  activeThreads = new Set(gameState.data.vietlott655.activeThreads);
  jackpot = gameState.data.vietlott655.jackpot;
  gameHistory = gameState.data.vietlott655.history; // Load history

  // Khởi tạo currentSession với players từ file
  currentSession = {
    players: gameState.data.vietlott655.players,
    startTime: Date.now(),
    endTime: Date.now() + (Object.keys(gameState.data.vietlott655.players).length > 0 ? DEFAULT_INTERVAL : MAX_INTERVAL) * 1000,
    interval: Object.keys(gameState.data.vietlott655.players).length > 0 ? DEFAULT_INTERVAL : MAX_INTERVAL,
  };

  gameJob = schedule.scheduleJob("* * * * * *", () => runGameLoop(api));
  console.log(chalk.magentaBright("Khởi động và nạp dữ liệu minigame Vietlott 6/55 hoàn tất"));
}

export function getJackpot() {
  return jackpot;
}

async function sendGameUpdate(api, remainingSeconds) {
  let playerInfo = "";
  let totalBets = new Big(0);
  let activeThreadsWithPlayers = new Set();

  // Sửa lại cách tính tổng tiền cược và hiển thị thông tin người chơi
  for (const [playerId, player] of Object.entries(currentSession.players)) {
    // Kiểm tra player.bets tồn tại
    if (player && player.bets && Array.isArray(player.bets)) {
      // Tính tổng tiền cược của người chơi
      let playerTotalBets = new Big(0);
      player.bets.forEach(bet => {
        if (bet && bet.amount) {
          playerTotalBets = playerTotalBets.plus(bet.amount);
        }
      });
      
      totalBets = totalBets.plus(playerTotalBets);

      // Hiển thị thông tin các lượt đặt của người chơi
      playerInfo += `${player.playerName}:\n`;
      player.bets.forEach((bet, index) => {
        if (bet && bet.numbers && bet.amount) {
          playerInfo += `Lượt ${index + 1}: ${bet.numbers.join(" - ")} [${formatCurrency(bet.amount)} VNĐ]\n`;
        }
      });
      playerInfo += "\n";

      if (player.threadId) {
        activeThreadsWithPlayers.add(player.threadId);
      }
    }
  }

  const result = {
    success: true,
    message:
      "[  VIETLOTT 6/55  ]" +
      "\nThời gian còn lại: " +
      formatSeconds(remainingSeconds) +
      "\n💰 Tiền hũ: " +
      formatCurrency(jackpot) +
      " VNĐ" +
      `\n💎 Giải Jackpot: x${PRIZE_RATIOS.JACKPOT} + Hũ` +
      `\n🌟 Giải Jackpot 2 (5 số + số phụ): x${PRIZE_RATIOS.JACKPOT2}` +
      `\n🎯 Giải Nhất (5 số): x${PRIZE_RATIOS.FIRST}` +
      `\n🎲 Giải Nhì (4 số): x${PRIZE_RATIOS.SECOND}` +
      `\n🎱 Giải Ba (3 số): x${PRIZE_RATIOS.THIRD}` +
      `\nTổng số người chơi: ${Object.keys(currentSession.players).length}` +
      "\n\nThông tin đặt cược:\n" +
      (playerInfo === "" ? "Chưa có ai đặt cược" : playerInfo),
  };

  const waitingImagePath = await createVietlott655WaitingImage(
    remainingSeconds,
    Object.keys(currentSession.players).length,
    totalBets.toNumber(),
    jackpot.toNumber()
  );

  // Tính toán timelive dựa trên thời gian đếm ngược
  let timelive = Math.ceil(remainingSeconds % 10) * 1000 - 1000;
  if (timelive <= 0) timelive = TIME_SEND_UPDATE;

  for (const threadId of activeThreadsWithPlayers) {
    if (activeThreads.has(threadId)) {
      await sendMessageImageNotQuote(api, result, threadId, waitingImagePath, timelive, true);
    }
  }

  await clearImagePath(waitingImagePath);
}

async function toggleThreadParticipation(api, message, threadId, isStart) {

  if (isStart) {
    if (!gameState.data.vietlott655.activeThreads.includes(threadId)) {
      gameState.data.vietlott655.activeThreads.push(threadId);
      activeThreads.add(threadId);
      saveGameData();
      await sendMessageFromSQL(api, message, {
        success: true,
        message: "Trò chơi Vietlott 6/55 đã được bật trong nhóm này.",
      });
    } else {
      await sendMessageFromSQL(api, message, {
        success: false,
        message: "Trò chơi Vietlott 6/55 đã được bật trước đó trong nhóm này.",
      });
    }
  } else {
    const index = gameState.data.vietlott655.activeThreads.indexOf(threadId);
    if (index > -1) {
      gameState.data.vietlott655.activeThreads.splice(index, 1);
      activeThreads.delete(threadId);
      saveGameData();
      await sendMessageFromSQL(api, message, {
        success: true,
        message: "Trò chơi Vietlott 6/55 đã bị tắt trong nhóm này.",
      });
    } else {
      await sendMessageFromSQL(api, message, {
        success: false,
        message: "Trò chơi Vietlott 6/55 chưa được bật trong nhóm này.",
      });
    }
  }
}

// Thêm hàm xử lý lệnh xem lịch sử
async function handleHistory(api, message, threadId) {
  if (gameHistory.length === 0) {
    // Thử đọc history từ file
    if (gameState.data.vietlott655.history && gameState.data.vietlott655.history.length > 0) {
      gameHistory = gameState.data.vietlott655.history;
    } else {
      await sendMessageFromSQL(api, message, {
        success: false,
        message: "Chưa có dữ liệu lịch sử.",
      }, false, 60000);
      return;
    }
  }

  let historyText = `${nameServer}\n📊 LỊCH SỬ VIETLOTT 6/55\n\n`;
  
  gameHistory.forEach((result, index) => {
    const date = new Date(result.timestamp);
    const timeString = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')} ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    
    historyText += `${index + 1}. [${timeString}]\n`;
    historyText += `Số chính: ${result.mainNumbers.join(" - ")}\n`;
    historyText += `Số phụ: ${result.extraNumber}\n\n`;
  });

  await sendMessageFromSQL(api, message, {
    success: true,
    message: historyText
  }, false, 60000);
}
