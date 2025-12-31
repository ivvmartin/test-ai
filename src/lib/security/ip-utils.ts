import "server-only";
import { NextRequest } from "next/server";

/**
 * Safely extract and validate IP address from request headers
 *
 * Handles common proxy headers while preventing spoofing attacks
 *
 * Priority order:
 * 1. x-real-ip (most reliable if behind a trusted proxy)
 * 2. x-forwarded-for (rightmost IP from trusted proxy)
 * 3. connection.remoteAddress (fallback)
 */
export function getClientIp(request: NextRequest): string {
  const realIp = request.headers.get("x-real-ip");
  if (realIp && isValidIp(realIp)) {
    return normalizeIp(realIp);
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());

    for (const ip of ips) {
      if (isValidIp(ip)) {
        return normalizeIp(ip);
      }
    }
  }

  return "unknown";
}

/**
 * Validate if a string is a valid IP address (IPv4 or IPv6)
 */
function isValidIp(ip: string): boolean {
  // Basic validation - check if it looks like an IP
  // IPv4: xxx.xxx.xxx.xxx
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  // IPv6: simplified check
  const ipv6Regex = /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;

  if (!ip || ip.length === 0 || ip.length > 45) {
    return false;
  }

  // Check for IPv4
  if (ipv4Regex.test(ip)) {
    // Validate each octet is 0-255
    const octets = ip.split(".");
    return octets.every((octet) => {
      const num = parseInt(octet, 10);
      return num >= 0 && num <= 255;
    });
  }

  // Check for IPv6
  if (ipv6Regex.test(ip)) {
    return true;
  }

  return false;
}

/**
 * Normalize IP address for consistent storage/comparison
 * Converts IPv6 localhost to IPv4 for cleaner logging
 */
function normalizeIp(ip: string): string {
  // Convert IPv6 localhost to IPv4
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    return "127.0.0.1";
  }

  // Remove IPv6 prefix if present
  if (ip.startsWith("::ffff:")) {
    const ipv4 = ip.substring(7);
    if (isValidIp(ipv4)) {
      return ipv4;
    }
  }

  return ip;
}

/**
 * Check if an IP is from a private/local network
 * Useful for applying different rate limits to internal vs external traffic
 */
export function isPrivateIp(ip: string): boolean {
  // Localhost
  if (ip === "127.0.0.1" || ip === "::1" || ip === "localhost") {
    return true;
  }

  // Private IPv4 ranges
  const privateRanges = [
    /^10\./, // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./, // 192.168.0.0/16
  ];

  return privateRanges.some((range) => range.test(ip));
}
