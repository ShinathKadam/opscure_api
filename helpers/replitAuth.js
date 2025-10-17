import { REPLIT_USERNAME, REPLIT_PASSWORD } from "../config/index.js";

export async function tryLogin(client, url) {
  return client.post(`${url}/api/login`, {
    username: REPLIT_USERNAME,
    password: REPLIT_PASSWORD,
  });
}

export async function tryRegister(client, url) {
  return client.post(`${url}/api/register`, {
    username: REPLIT_USERNAME,
    password: REPLIT_PASSWORD,
  });
}
