"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { usersApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Save,
  Lock,
  BadgeCheck,
} from "lucide-react";
import { toast } from "sonner";
import type { User as UserType } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  doctor: "Doctor",
  national_admin: "National Admin",
  user: "Patient",
};

function formatRoles(roles: string[]): string {
  if (!roles?.length) return "Patient";
  return roles.map((r) => ROLE_LABELS[r] ?? r).join(", ");
}

function ProfileContent({
  user,
  refreshUser,
}: {
  user: UserType;
  refreshUser: () => Promise<void>;
}) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [fullName, setFullName] = useState(user.full_name);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const trimmedFullName = fullName.trim();
  const trimmedPhone = phone.trim();
  const profileUnchanged =
    trimmedFullName === user.full_name &&
    trimmedPhone === (user.phone ?? "");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await usersApi.updateProfile({
        full_name: trimmedFullName,
        phone: trimmedPhone,
      });
      setFullName(trimmedFullName);
      setPhone(trimmedPhone);
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsChangingPassword(true);
    try {
      await usersApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error("Failed to change password. Check your current password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your account information and security settings
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>Your basic account details</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                Full Name
              </p>
              <p className="text-sm font-medium break-words">{user.full_name}</p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3 shrink-0" />
                Email Address
              </p>
              <p className="text-sm font-medium break-all">{user.email}</p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                Phone
              </p>
              <p className="text-sm font-medium break-words">
                {user.phone || "Not set"}
              </p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3 shrink-0" />
                Account Role
              </p>
              <p className="text-sm font-medium">{formatRoles(user.roles)}</p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 shrink-0" />
                Member Since
              </p>
              <p className="text-sm font-medium">
                {formatDate(user.created_at)}
              </p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <BadgeCheck className="h-3 w-3 shrink-0" />
                Verification
              </p>
              <p className="text-sm font-medium">
                {user.is_verified ? "Verified" : "Unverified"}
              </p>
            </div>
            <div className="space-y-1 min-w-0">
              <p className="text-sm text-muted-foreground">Account Status</p>
              <p className="text-sm font-medium">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
                    user.is_active
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}
                >
                  {user.is_active ? "Active" : "Inactive"}
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Edit Profile
          </CardTitle>
          <CardDescription>Update your profile information</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
              />
            </div>
            <Button type="submit" disabled={isUpdating || profileUnchanged}>
              {isUpdating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
              />
            </div>
            <Button
              type="submit"
              disabled={
                isChangingPassword ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {isChangingPassword ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Changing...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return <ProfileContent user={user} refreshUser={refreshUser} />;
}
