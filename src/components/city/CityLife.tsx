import { CityAmbientSound } from "@/components/city/life/ambient-sound";
import { AutonomousNpcs } from "@/components/city/life/autonomous-npcs";
import { CityCats } from "@/components/city/life/cats";
import { CityCyclists } from "@/components/city/life/cyclists";
import { Pedestrians } from "@/components/city/life/pedestrians";
import { Birds, Clouds, LampGlow, SkyLife } from "@/components/city/life/sky";
import { SocialNpcs } from "@/components/city/life/social-npcs";
import { TrafficLights } from "@/components/city/life/traffic-lights";
import { Traffic } from "@/components/city/life/traffic";

export { Sway } from "@/components/city/life/shared";

/**
 * Elemen hidup kota (mobil, pesepeda, kucing, pejalan kaki, NPC, dan trem).
 * Posisi NPC dan lampu lalu lintas dikirim server lewat npc:world (lihat lib/npcRuntime.ts),
 * sehingga semua pemain melihat posisi yang sama. Elemen ini tidak ikut collision.
 */
export function CityLife({ isNight = false }: { isNight?: boolean }) {
  return (
    <group>
      <Pedestrians />
      <SocialNpcs />
      <AutonomousNpcs />
      <CityCats />
      <CityCyclists />
      <TrafficLights />
      <Traffic isNight={isNight} />
      <Birds />
      <Clouds />
      <LampGlow />
      <SkyLife />
      <CityAmbientSound />
    </group>
  );
}
