import { appContext } from "../context.js";
import { ZaloApiError } from "../Errors/ZaloApiError.js";
import { encodeAES, handleZaloResponse, request, makeURL } from "../utils.js";
import { Zalo } from "../index.js";

export function removeUserFromGroupFactory(api) {
    const serviceURL = makeURL(`${api.zpwServiceMap.group[0]}/api/group/kickout`, {
        zpw_ver: Zalo.API_VERSION,
        zpw_type: Zalo.API_TYPE,
    });
    /**
     * Remove user from existing group
     *
     * @param groupId Group ID
     * @param members User ID or list of user IDs to remove
     *
     * @throws ZaloApiError
     */
    return async function removeUserFromGroup(groupId, members) {
		if (!appContext.secretKey || !appContext.imei || !appContext.cookie || !appContext.userAgent)
			throw new ZaloApiError("Missing required app context fields");
        if (!groupId) throw new ZaloApiError("Missing groupId");
        if (!members) throw new ZaloApiError("Missing members");
        if (!Array.isArray(members))
            members = [members];
        const params = {
            grid: groupId,
            members: members,
            imei: appContext.imei,
        };
        const encryptedParams = encodeAES(appContext.secretKey, JSON.stringify(params));
        if (!encryptedParams)
            throw new ZaloApiError("Failed to encrypt params");
        const response = await request(serviceURL, {
            method: "POST",
            body: new URLSearchParams({
                params: encryptedParams,
            }),
        });
        const result = await handleZaloResponse(response);
        if (result.error)
            throw new ZaloApiError(result.error.message, result.error.code);
        return result.data;
    };
}
