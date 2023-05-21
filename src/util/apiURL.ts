"use strict";

const currentProtocol = window.location.protocol;
const currentDomain = window.location.hostname;
const port: string = "3017";
const apiURL: string = currentProtocol + "//" + currentDomain + ":" + port;

export default apiURL;
