import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { notificationApi } from "../services/featureService";

export const fetchNotifications = createAsyncThunk(
  "notifications/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationApi.list();
      return res.data || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || "Failed to load notifications");
    }
  }
);

export const markNotificationRead = createAsyncThunk(
  "notifications/markRead",
  async (id, { rejectWithValue }) => {
    try {
      await notificationApi.markRead(id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || "Failed to mark as read");
    }
  }
);

export const markAllNotificationsRead = createAsyncThunk(
  "notifications/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      await notificationApi.markAllRead();
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || "Failed to mark all as read");
    }
  }
);

export const deleteNotification = createAsyncThunk(
  "notifications/delete",
  async (id, { rejectWithValue }) => {
    try {
      await notificationApi.remove(id);
      return id;
    } catch (err) {
      return rejectWithValue(err?.response?.data?.error || "Failed to delete notification");
    }
  }
);

const notificationSlice = createSlice({
  name: "notifications",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearNotifications: (state) => {
      state.items = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const item = state.items.find((n) => n._id === action.payload);
        if (item) item.isRead = true;
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true;
        });
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.items = state.items.filter((n) => n._id !== action.payload);
      });
  },
});

export const selectNotifications = (state) => state.notifications.items;
export const selectNotificationsLoading = (state) => state.notifications.loading;
export const selectUnreadCount = (state) =>
  state.notifications.items.filter((n) => !n.isRead).length;

export const { clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
