import { createSlice } from "@reduxjs/toolkit";
import { getStorageItem, setStorageItem, clearStorage } from "@/shared/utils/safariLocalStorage";

const token = getStorageItem("token");
const userId = getStorageItem("userId");
const email = getStorageItem("email");
const userName = getStorageItem("userName");
const role = getStorageItem("role");
const pictureURL = getStorageItem("pictureURL");
const registerFlag = getStorageItem("registerFlag") === "true";
const clientDetailSet = getStorageItem("clientDetailSet") === "true";

const initialState = {
  loggedIn: !!token,
  token,
  userId,
  email,
  userName,
  role,
  pictureURL,
  registerFlag,
  clientDetailSet,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      const {
        token,
        userId,
        email,
        userName,
        role,
        pictureURL,
        registerFlag,
        clientDetailSet,
      } = action.payload;

      // Update Redux state
      state.loggedIn = true;
      state.token = token;
      state.userId = userId;
      state.email = email;
      state.userName = userName;
      state.role = role;
      state.pictureURL = pictureURL;
      state.registerFlag = registerFlag;
      state.clientDetailSet = clientDetailSet;

      // Store in localStorage using Safari-specific utilities
      setStorageItem("token", token);
      setStorageItem("userId", userId);
      setStorageItem("email", email);
      setStorageItem("role", role);
      setStorageItem("userName", userName);
      setStorageItem("pictureURL", pictureURL);
      setStorageItem("registerFlag", registerFlag.toString());
      setStorageItem("clientDetailSet", clientDetailSet.toString());
    },
    logout: (state) => {
      state.loggedIn = false;
      state.token = null;
      state.userId = null;
      state.email = null;
      state.userName = "";
      state.role = "";
      state.pictureURL = "";
      state.registerFlag = false;
      state.clientDetailSet = false;

      // Clear localStorage using cross-browser utilities
      try {
        clearStorage();
      } catch (error) {
        
      }
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
