import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { UserRound, Mail, BadgeCheck } from "lucide-react";
import { addUser, removeUser } from "../store/userSlice";
import { clearNotifications } from "../store/notificationSlice";
import api from "../api/client";
import toast from "react-hot-toast";

const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const EditProfileModal = ({
  open,
  onClose,
  formData,
  setFormData,
  loading,
  error,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-md overflow-y-auto rounded-xl bg-white p-4 shadow-lg max-h-[90vh] md:p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-slate-900">Edit Profile</h3>
        <p className="mt-1 text-sm text-slate-500">
          Update your name and email address.
        </p>

        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600">Name</label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, userName: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          ) : null}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="w-full sm:w-auto rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Profile = () => {
  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [formData, setFormData] = useState({
    userName: user?.userName || "",
    email: user?.email || "",
  });

  const profileInfo = useMemo(
    () => ({
      userName: user?.userName || "N/A",
      email: user?.email || "N/A",
      accountType: "Standard User",
    }),
    [user]
  );

  const handleEditProfile = () => {
    setFormData({
      userName: user?.userName || "",
      email: user?.email || "",
    });
    setEditError("");
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    if (isEditLoading) return;
    setIsEditOpen(false);
    setEditError("");
  };

  const submitEdit = async () => {
    const userName = formData.userName.trim();
    const email = formData.email.trim();

    if (!userName || !email) {
      setEditError("Name and email are required");
      return;
    }

    if (!validateEmail(email)) {
      const msg = "Please enter a valid email address.";
      setEditError(msg);
      toast.error(msg);
      return;
    }

    try {
      setIsEditLoading(true);
      setEditError("");

      const res = await api.put("/user/profile", { userName, email });

      const updatedUser = res.data?.user;
      if (!updatedUser) throw new Error("Invalid server response");

      dispatch(addUser(updatedUser));
      toast.success("Profile updated");
      setIsEditOpen(false);
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update profile";
      setEditError(message);
      toast.error(message);
    } finally {
      setIsEditLoading(false);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await api.post("/logout");
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      sessionStorage.removeItem("authToken");
      localStorage.removeItem("token");
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      dispatch(removeUser());
      dispatch(clearNotifications());
      navigate("/login", { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center px-3 py-4 sm:px-4 sm:py-6 md:py-8 bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 pb-24">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 p-6 sm:p-8 md:p-10">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 leading-tight">
          Profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your account information.
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <UserRound size={16} className="text-slate-500" />
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                User Name
              </p>
            </div>
            <p className="mt-2 text-xl font-semibold text-slate-900">
              {profileInfo.userName}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-slate-500" />
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Email
              </p>
            </div>
            <p className="mt-2 text-base font-medium text-slate-900 break-all">
              {profileInfo.email}
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3">
            <div className="flex items-center gap-2">
              <BadgeCheck size={16} className="text-slate-500" />
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                Account Type
              </p>
            </div>
            <p className="mt-2 text-base font-medium text-slate-900">
              {profileInfo.accountType}
            </p>
          </div>
        </div>

        <div className="mt-9 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleEditProfile}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:scale-105 transition-all duration-300"
          >
            Edit Profile
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 hover:scale-105 transition-all duration-300 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:bg-red-400"
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      </div>

      <EditProfileModal
        open={isEditOpen}
        onClose={closeEdit}
        formData={formData}
        setFormData={setFormData}
        loading={isEditLoading}
        error={editError}
        onSubmit={submitEdit}
      />
    </div>
  );
};

export default Profile;
