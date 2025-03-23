import { getUserInfoData } from "../../info-service/user-info.js";
import { isAdmin } from "../../../index.js";
import { getGlobalPrefix } from "../../service.js";
import { removeMention } from "../../../utils/format-util.js";

const scoldUsers = new Map();
let isScoldingActive = false;

export async function scoldUser(api, message) {
  const prefix = getGlobalPrefix();
  const senderId = message.data.uidFrom;
  const threadId = message.threadId;
  const content = removeMention(message);

  if (content.toLowerCase() === `${prefix}scold tha`) {
    if (isAdmin(senderId, threadId) && isScoldingActive) {
      isScoldingActive = false;
      api.sendMessage({ msg: "Dạ Đại Ca em sẽ tha cho nó.", quote: message }, threadId, message.type);
      return;
    }
  }

  let delay = 2000;
  const args = content.split(' ').filter(arg => arg !== '');
  const delayArg = args.find(arg => {
    const cleanArg = arg.toLowerCase().replace('ms', '');
    return !isNaN(cleanArg);
  });

  if (delayArg) {
    const cleanDelay = parseInt(delayArg.toLowerCase().replace('ms', ''));
    delay = cleanDelay;
    if (delay < 100) delay = 100;
    delay = Math.min(delay, 10000);
  }

  if (!isScoldingActive) {
    isScoldingActive = true;
  }

  if (!message.data.mentions || message.data.mentions.length === 0) {
    await api.sendMessage({ msg: ":D Đại Ca muốn em chửi ai? 🚀", quote: message }, threadId, message.type);
    return;
  }

  const userId = message.data.mentions[0].uid;

  if (isAdmin(userId, threadId)) {
    await api.sendMessage(
      { msg: "Đéo thể ra lệnh chửi quản trị bot. 🚫", quote: message },
      threadId,
      message.type
    );
    return;
  }

  if (scoldUsers.has(userId)) {
    await api.sendMessage(
      {
        msg: "Người này đang bị chửi.",
        quote: message,
      },
      threadId,
      message.type
    );
    return;
  }

  const scoldMessages = [
    "Mày ra đây tao bảo, hiện hồn nhanh con chó",
    "Hiện hồn nhanh Đéo tao đốt nhà mày giờ",
    "Địt mẹ mày bố nói tử tế mà Đéo dậy à",
    "Nhanh ra chửi nhau với tao",
    "Tao ném trứng thối đổ dầu đổ xăng vào nhà mày giờ",
    "Hoá ra cũng chỉ là con chó mang hình dáng người",
    "Làm người thì khó, làm chó thì dễ ..!!",
    "Đừng tỏ vẻ máu liều nhiều hơn máu não",
    "Đụ con đĩ mẹ mày",
    "Con chó mày đứng lên đi",
    "Địt mẹ bố gọi Đéo nghe à",
    "Hiện hồn đi thằng mặt lồn",
    "Đĩ mẹ mày ra đây bô xem nào",
    "Tao ném trứng thối đổ dầu đổ xăng vào nhà mày giờ",
    "Bố mày bắn rap chết cụ mày giờ",
    "Vậy thì xin mời nghe tao rap địt chết cả lò mày nhà con",
    "Đầu tiên tao xin phép địt từ trên xuống dưới con",
    "Tao địt từ lỗ lồn đến lỗ nhị con lồn",
    "Lồn thì to như lồn trâu thủ dâm ống cống ấy nhé con",
    "Tao địt chắc 2 thằng như tao chưa đủ lấp cái lỗ lồn nhà mày đâu",
    "Đụ con đĩ mẹ mày",
    "Thằng óc cức",
    "Mẹ m đẻ m ra đau lồn chứ được con cặc gì",
    "Con mẹ mày đẻ m ra đau lồn chứ được con cặc gì",
    "...",
    "Tao địt mẹ mày đến mấy lần rồi con",
    "Tinh trùng khuyết tật",
    "Hồi đó ba mày Đéo dùng bao nên lòi ra thằng mặt cặc như mày đó",
    "Con mẹ mày",
    "Thằng lồn óc chó",
    "Thứ súc vật",
    "Tao là bố của mẹ mày",
    "Chửi chết con mẹ mày luôn",
    "Có giỏi thì bơi ra chửi tay đôi đi thằng lồn",
    "Mày nghĩ gì mà động vào Đại Ca tao",
    "Loại rác rưỡi như mày thì Đéo có tuổi",
    "Mày có phải con chó Đéo?",
    "Người Đéo thể ngu vậy được",
    "Cút con mẹ mày đi...",
    "Thứ lồn, đỉ mẹ mày",
    "Mày động nhầm người rồi con chó ạ",
    "Bố mày chấp, thứ súc sinh đội lớp thú",
    "Chửi chết mẹ mày luôn",
    "Lần sau gặp Đại Ca tao thì né xa ra, địt mẹ mày"
  ];

  scoldUsers.set(userId, true);
  isScoldingActive = true;

  let count = 0;
  const interval = setInterval(async () => {
    if (!isScoldingActive) {
      const genderText = userTarget.genderId === 0 ? "Thằng Oắt Con" : userTarget.genderId === 1 ? "Oắc Con" : "Thằng Oắt Con";
      await api.sendMessage(
        {
          msg: `${genderText} ${userTarget.name}, nể Đại Ca của tao tha mày lần này, cảm ơn Đại Ca tao đi!`,
          mentions: [{ pos: genderText.length + 1, uid: userTarget.uid, len: userTarget.name.length }],
        },
        threadId,
        message.type
      );
      scoldUsers.delete(userId);
      clearInterval(interval);
      return;
    }

    if (count >= scoldMessages.length) {
      count = 0;
    }

    const randomMessage = scoldMessages[count];
    await api.sendMessage(
      {
        msg: `${userTarget.name} ${randomMessage}`,
        mentions: [{ pos: 0, uid: userTarget.uid, len: userTarget.name.length }],
      },
      threadId,
      message.type
    );
    count++;
  }, delay);

  const userTarget = await getUserInfoData(api, userId);
  const caption = `Tao chuẩn bị mắng yêu `;
  await api.sendMessage(
    {
      msg: caption + `${userTarget.name}!!`,
      mentions: [{ pos: caption.length, uid: userId, len: userTarget.name.length }],
    },
    threadId,
    message.type
  );
}
