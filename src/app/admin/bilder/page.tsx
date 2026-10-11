import AdminHeader from "@/components/admin/AdminHeader";
import MediaLibrary from "@/components/admin/MediaLibrary";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { collectUsage, type LibraryImage } from "@/lib/media-library";

export const metadata = { title: "Bilder" };

export default async function MediaLibraryPage() {
  await requireUser();
  const [images, usage] = await Promise.all([
    all<LibraryImage>("SELECT * FROM media ORDER BY created_at DESC, id DESC"),
    collectUsage(),
  ]);

  return (
    <>
      <AdminHeader
        title="Bilder"
        description="Alla bilder som laddats upp till hemsidan, utom galleriets album. En bild kan ligga sparad här utan att visas någonstans, och du kan välja den i vilket bildfält som helst."
      />
      <MediaLibrary images={images.map((img) => ({ ...img, usedIn: usage(img.src, img.medium, img.thumb) }))} />
    </>
  );
}
