"use strict";

const currentProtocol = window.location.protocol;
const currentDomain = window.location.hostname;
const port: string = "3037";
const apiURL: string = currentProtocol + "//" + currentDomain + ":" + port;

export const API_PUT_MEMO = `${apiURL}/api/putMemo`;
export const API_GET_MEMO = `${apiURL}/api/getMemo`;
export const API_DELETE_MEMO = `${apiURL}/api/deleteMemo`;
// export const API_GET_TAGS = `${apiURL}/api/getTags`;
// export const API_GET_MEMO_BY_TAG = `${apiURL}/api/getMemoByTag`;
export default apiURL;
