import { getActiveFonts } from "@/server/actions/fonts";
import { FontLoader } from "@/components/features/settings/font-loader";

export async function ActiveFontLoader() {
  const fonts = await getActiveFonts();
  return <FontLoader fonts={fonts} />;
}
