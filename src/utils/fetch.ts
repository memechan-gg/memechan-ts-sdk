import { Sha256 } from "@aws-crypto/sha256-browser/build/main/crossPlatformSha256";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { SignatureV4 } from "@aws-sdk/signature-v4";
import { IAMCredentials } from "../auth/types";
import { BE_REGION } from "../constants";

export const jsonFetch = async (
  input: string | URL | globalThis.Request,
  init?: Omit<RequestInit, "body"> & { body: unknown },
) => {
  let body;
  if (init?.body) {
    body = JSON.stringify(init.body);
  }
  const r = await fetch(input, { ...init, body });
  if (!r.ok) {
    const body = await r.json();
    throw new Error(JSON.stringify({ body, status: r.statusText }));
  }
  return r.json();
};

export const signedJsonFetch = async (
  input: string,
  credentials: IAMCredentials,
  init?: Omit<RequestInit, "body"> & {
    body?: unknown;
  },
) => {
  const service = "execute-api";
  const { method, body } = init || {};
  const parsedUrl = new URL(input);
  const query: Record<string, string> = {};
  for (const [key, value] of parsedUrl.searchParams.entries()) {
    query[key] = value;
  }
  const request = new HttpRequest({
    method: method?.toUpperCase(),
    query,
    headers: {
      "Content-Type": "application/json",
      Host: parsedUrl.hostname,
    },
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
    body: body ? JSON.stringify(body) : undefined,
  });

  const signer = new SignatureV4({
    region: BE_REGION,
    credentials,
    service,
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);
  const queryParams = Object.keys(query).length > 0 ? "?" + parsedUrl.searchParams.toString() : "";
  return jsonFetch(`https://${signedRequest.hostname}${signedRequest.path}${queryParams}`, {
    method: signedRequest.method,
    headers: signedRequest.headers,
    body: signedRequest.body,
  });
};

/**
 * Sends a signed multipart/form-data request.
 * @param {string} input The URL to which the request is sent.
 * @param {IAMCredentials} credentials The credentials used for signing the request.
 * @param {File[]} files Array of files to be uploaded.
 * @param {Record<string, string>} fields Other form fields to be included in the multipart request.
 * @return {Promise<any>} A promise that resolves with the response of the fetch request.
 */
export const signedMultipartRequest = async (input: string, credentials: IAMCredentials, files: File[]) => {
  const parsedUrl = new URL(input);
  const formData = new FormData();

  files.forEach((file) => formData.append(file.name, file));

  const request = new HttpRequest({
    method: "POST",
    headers: {
      "Content-Type": "multipart/form-data",
      Host: parsedUrl.hostname,
    },
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname,
    body: formData,
  });

  const signer = new SignatureV4({
    region: BE_REGION,
    credentials,
    service: "execute-api",
    sha256: Sha256,
  });

  const signedRequest = await signer.sign(request);

  return fetch(`https://${signedRequest.hostname}${signedRequest.path}`, {
    method: signedRequest.method,
    headers: signedRequest.headers,
    body: signedRequest.body,
  });
};