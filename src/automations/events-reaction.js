import { handleReactionConfirmJoinGroup } from "../commands/bot-manager/remote-action-group.js";
import { handleTikTokReaction } from "../service-dqt/api-crawl/tiktok/tiktok-service.js";

//Xử Lý Sự Kiện Reaction
export async function reactionEvents(api, reaction) {
  if (await handleReactionConfirmJoinGroup(api, reaction)) return;
  if (await handleTikTokReaction(api, reaction)) return;
}
