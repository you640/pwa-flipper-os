import { useEffect, useState, useRef } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEO } from "@/components/seo/SEO";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";

export default function Profile() {
  const { user, profile, isAdmin, displayName, initials, refresh, loading } = useProfile();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(profile?.display_name ?? "");
    setBio(profile?.bio ?? "");
  }, [profile?.display_name, profile?.bio]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: name.trim() || null, bio: bio.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      console.error(error);
      toast.error("Could not save profile");
      return;
    }
    toast.success("Profile updated");
    refresh();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updErr } = await supabase
        .from("profiles")
        .update({ avatar_url: data.publicUrl })
        .eq("id", user.id);
      if (updErr) throw updErr;
      toast.success("Avatar updated");
      refresh();
    } catch (err) {
      console.error(err);
      toast.error("Avatar upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <AppLayout>
      <SEO title="Profile | Flipper OS" description="Manage your Flipper OS profile, avatar, and bio." />

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">Personal details visible across your workspace.</p>
        </div>

        <div className="relative rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl shadow-xl md:p-8">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <div className="relative">
                  <Avatar className="h-20 w-20 border border-border/60">
                    <AvatarImage src={profile?.avatar_url ?? ""} alt={displayName} />
                    <AvatarFallback className="bg-gradient-primary text-lg font-semibold text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-foreground">{displayName}</h2>
                    <Badge variant={isAdmin ? "default" : "secondary"}>{isAdmin ? "Admin" : "Member"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Upload avatar
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.email ?? ""} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="A short description about you…"
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-gradient-primary shadow-glow">
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save changes
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
