import { avatars } from "./appwriteClient";

export const getShareQR = (shareUrl, size = 200) => {
  return avatars.getQR(shareUrl, size, 0, 0).toString();
};
