import { Sha256 } from "@aws-crypto/sha256-browser";
import { IAMCredentials } from "../auth/types";
import { BE_REGION } from "../constants";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";
import { createSignedFetcher } from "./sigv4";

export const jsonFetch = async (
  input: string | URL | globalThis.Request,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
) => {
  let body;
  if (init?.body) {
    body = JSON.stringify(init.body);
  }
  const r = await fetch(input, { ...init, body });
  if (!r.ok) {
    const body = await r.text();
    try {
      throw new Error(JSON.stringify({ body, status: r.statusText }));
    } catch (e) {
      throw new Error(body);
    }
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
  const { method, body } = init || {};
  const signedFetch = createSignedFetcher({ service: "execute-api", region: BE_REGION, credentials });
  const r = await signedFetch(input, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: { "Content-Type": "application/json" },
  });
  if (!r.ok) {
    const body = await r.text();
    try {
      throw new Error(JSON.stringify({ body, status: r.statusText }));
    } catch (e) {
      throw new Error(body);
    }
  }
  return r.json();
};

export const unsignedMultipartRequest = async (input: string, file: File) => {
  const formData = new FormData();

  formData.append("file", file);

  try {
    const r = await fetch(input, {
      method: "POST",
      headers: {
        Accept: file.type,
      },
      body: formData,
    });
    if (!r.ok) {
      const body = await r.json();
      throw new Error(JSON.stringify({ body, status: r.statusText }));
    }
    return r.json();
  } catch (error) {
    console.error("Upload failed:", error);
    throw error;
  }
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
      Host: parsedUrl.hostname,
      "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
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

  const signedRequest = await signer.sign(request, {
    unsignableHeaders: new Set(["content-type"]),
  });

  return fetch(`https://${signedRequest.hostname}${signedRequest.path}`, {
    method: signedRequest.method,
    headers: signedRequest.headers,
    body: request.body,
  });
};
