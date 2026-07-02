import axios from "axios";
import { API_BASE_URL } from "../../shared/services/firebaseConfig";
import {
  shouldUseCrossDomainAuth,
  getAuthEndpoint,
  shouldUseCredentials,
} from "../../shared/utils/authDetection";
import { storeTokens } from "../../shared/utils/tokenStorage";

// Exchange a Firebase ID token for an EzeeRoom session and return the
// normalized auth payload expected by AuthProvider.login().
//
// Shared by both the popup flow (GoogleSignInButton) and Google One Tap
// (GoogleOneTap) so the cross-domain / token-storage logic lives in one place.
export const exchangeFirebaseIdToken = async (idToken) => {
  const useCrossDomain = shouldUseCrossDomainAuth();
  const authEndpoint = getAuthEndpoint();

  // macOS Safari supports SameSite=None; Secure cookies even in cross-domain.
  // iOS devices need localStorage tokens for cross-domain (no credentials).
  const useCredentials = shouldUseCredentials();

  const res = await axios.post(
    `${API_BASE_URL}${authEndpoint}`,
    { idToken },
    {
      headers: { "Content-Type": "application/json" },
      withCredentials: useCredentials,
      timeout: 15000,
    }
  );

  if (res.status !== 200) {
    throw new Error("Unexpected response from authentication server");
  }

  // Backend sends a single 'token' field (or 'accessToken' for backward compat).
  // macOS Safari uses cookies even cross-domain, so it won't receive a token.
  const token = res.data.token || res.data.accessToken;
  if (useCrossDomain && token) {
    const tokenStored = storeTokens({ token });
    if (!tokenStored) {
      throw new Error("Failed to store authentication token");
    }
  }

  return {
    email: res.data.user.email,
    userid: res.data.user.id,
    roles: res.data.user.roles || [],
    userName: res.data.user.name,
    pictureURL: res.data.user.profilePicUrl,
    flag: res.data.user.registerFlag || false,
    detailSet: res.data.user.detailSet || false,
    hotelIds:
      res.data.user.hotelIds ||
      (res.data.user.hotelId ? [res.data.user.hotelId] : []),
    authMethod: useCrossDomain ? "localStorage" : "cookie",
  };
};
