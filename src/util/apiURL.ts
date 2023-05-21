"use strict";

const currentProtocol = window.location.protocol;
const currentDomain = window.location.hostname;
// const port: string = "3037";
const apiURL: string = currentProtocol + "//" + currentDomain;

export default apiURL;
