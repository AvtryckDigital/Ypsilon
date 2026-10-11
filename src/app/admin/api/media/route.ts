import type { NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { all } from "@/lib/db";
import type { PickerAlbum, PickerImage } from "@/lib/types";

// Bilder till bildväljaren i admin.
//   /admin/api/media            biblioteket och listan över album
//   /admin/api/media?album=12   bilderna i ett album, även opublicerade album
export async function GET(req: NextRequest) {
  const user = await getUser();
  if (!user) return Response.json({ error: "Du är inte inloggad." }, { status: 401 });

  const albumId = Number(req.nextUrl.searchParams.get("album"));
  if (albumId) {
    const images = await all<PickerImage>(
      `SELECT src, thumb, caption AS name, width, height FROM album_images
       WHERE album_id = ? ORDER BY sort_order, id`,
      albumId,
    );
    return Response.json({ images });
  }

  const [library, albums] = await Promise.all([
    all<PickerImage>(
      "SELECT src, COALESCE(thumb, medium, src) AS thumb, name, width, height FROM media ORDER BY created_at DESC, id DESC",
    ),
    all<PickerAlbum>(
      `SELECT a.id, a.title, a.published, COUNT(i.id) AS count FROM albums a
       JOIN album_images i ON i.album_id = a.id
       GROUP BY a.id ORDER BY COALESCE(a.event_date, a.created_at) DESC, a.id DESC`,
    ),
  ]);
  return Response.json({ library, albums });
}
