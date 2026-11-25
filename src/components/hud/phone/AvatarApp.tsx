import { useEffect, useState } from "react";
import { Check, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AVATAR_PRESETS,
  normalizeAvatarId,
  setLocalAvatarId,
  useLocalAvatarId,
  type AvatarGender,
  type AvatarId,
} from "@/config/avatars";
import { AppHeader } from "@/components/hud/phone/ui";

export function AvatarApp({ onBack }: { onBack: () => void }) {
  const localId = useLocalAvatarId();
  const [selected, setSelected] = useState<AvatarId>(localId ?? "male_1");
  const [genderTab, setGenderTab] = useState<AvatarGender>("male");
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // Muat avatar yang tersimpan (untuk akun login maupun tamu)
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) return;
      const char = normalizeAvatarId(
        session.user.user_metadata?.character as string | undefined,
      );
      if (char) {
        setSelected(char);
        setGenderTab(char.startsWith("female") ? "female" : "male");
      }
    });
  }, []);

  const list = AVATAR_PRESETS.filter((p) => p.gender === genderTab);

  const handleSave = async () => {
    setStatusMsg(null);
    // Tampilan lokal langsung berubah
    setLocalAvatarId(selected);

    // Tamu (anonim) juga punya session, jadi tetap disimpan ke metadata
    // supaya pemain lain melihat avatar yang sama.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setStatusMsg("Avatar diterapkan!");
      return;
    }

    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: { character: selected },
    });
    if (error) {
      setSaving(false);
      setStatusMsg(error.message);
      return;
    }
    await supabase.auth.refreshSession();
    setSaving(false);
    setStatusMsg("Avatar berhasil disimpan!");
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-slate-950/90">
      <AppHeader title="Ganti Avatar" onBack={onBack} />
      <div className="flex flex-1 flex-col justify-between overflow-hidden p-3 gap-2">
        {/* Tab Cowok / Cewek */}
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1 text-[11px] font-bold">
          <button
            type="button"
            onClick={() => setGenderTab("male")}
            className={`rounded-lg py-1 transition cursor-pointer ${
              genderTab === "male"
                ? "bg-blue-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Cowok (3)
          </button>
          <button
            type="button"
            onClick={() => setGenderTab("female")}
            className={`rounded-lg py-1 transition cursor-pointer ${
              genderTab === "female"
                ? "bg-pink-600 text-white"
                : "text-white/60 hover:text-white"
            }`}
          >
            Cewek (3)
          </button>
        </div>

        {/* Daftar 3 preset per kategori */}
        <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden pr-0.5">
          {list.map((opt) => {
            const active = selected === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  setSelected(opt.id);
                  setLocalAvatarId(opt.id);
                  setStatusMsg(null);
                }}
                className={`flex w-full items-center gap-2.5 rounded-2xl border p-2 text-left transition cursor-pointer ${
                  active
                    ? "border-sky-400 bg-sky-500/15"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br ${opt.swatchClass} text-white`}
                >
                  <UserRound className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white">{opt.name}</p>
                  <p className="text-[10px] text-white/55">{opt.styleLabel}</p>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-sky-400" />}
              </button>
            );
          })}
        </div>

        <div className="space-y-1.5">
          {statusMsg && (
            <p className="text-center text-[10px] text-emerald-300">
              {statusMsg}
            </p>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleSave()}
            className="w-full rounded-xl bg-blue-600 py-2 text-xs font-bold text-white transition hover:bg-blue-500 disabled:opacity-50 cursor-pointer"
          >
            {saving ? "Menyimpan..." : "Simpan Avatar"}
          </button>
        </div>
      </div>
    </div>
  );
}
