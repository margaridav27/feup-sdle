import { createHash } from "crypto";

export function array2str(uint8buf) {
  let buf = new ArrayBuffer(uint8buf.length);
  let bufView = new Uint16Array(buf);
  let count = 0;
  for (let i = 0; i < bufView.length; i++) {
    bufView[i] = uint8buf[count++] + (uint8buf[count++] << 8);
  }
  return String.fromCharCode.apply(null, bufView);
}

export function str2array(str) {
  let buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  let bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return new Uint8Array(bufView.buffer, bufView.byteOffset, bufView.byteLength);
}

export function hash(str) {
  return createHash("sha256").update(str).digest("hex");
}
