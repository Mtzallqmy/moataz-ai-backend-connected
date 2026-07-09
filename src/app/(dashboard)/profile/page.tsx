"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { User, Mail, MapPin, Briefcase, Globe, Camera, Save, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { getInitials } from "@/lib/format";
import { toast } from "sonner";

export default function ProfilePage() {
  const t = useTranslations();
  const tProfile = useTranslations("profile");
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [bio, setBio] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("");
  const [website, setWebsite] = useState("");

  const handleSave = () => {
    updateProfile({ name, email });
    toast.success(tProfile("saveProfile") + " - " + t("settings.changesSaved"));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={tProfile("title")}
        description={tProfile("subtitle")}
        actions={
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {tProfile("saveProfile")}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Avatar card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{tProfile("avatar")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-gradient-to-br from-primary to-chart-4 text-primary-foreground text-2xl font-bold">
                {getInitials(name)}
              </AvatarFallback>
            </Avatar>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm">
                <Camera className="mr-2 h-3.5 w-3.5" />
                {tProfile("uploadAvatar")}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">JPG, PNG or GIF. Max size 2MB.</p>
          </CardContent>
        </Card>

        {/* Personal info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{tProfile("personalInfo")}</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{tProfile("fullName")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{tProfile("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">{tProfile("jobTitle")}</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{tProfile("location")}</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} className="pl-9" />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">{tProfile("website")}</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">{tProfile("bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="resize-none"
                placeholder="Tell us about yourself..."
              />
              <p className="text-xs text-muted-foreground">{bio.length} / 500 characters</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
