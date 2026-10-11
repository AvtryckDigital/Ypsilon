import { getAllEvents } from "@/lib/data";
import { parseLocal } from "@/lib/format";

export const dynamic = "force-dynamic";

// Kalenderfeed som går att prenumerera på i Google Kalender, Apple Kalender och Outlook.
const pad = (n: number) => String(n).padStart(2, "0");

function icsLocal(value: string, addHours = 0) {
  const p = parseLocal(value)!;
  const allDay = p.hh === null;
  if (allDay) return { allDay, text: `${p.y}${pad(p.m)}${pad(p.d)}` };
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d, p.hh!, p.mm ?? 0) + addHours * 3600_000);
  return {
    allDay,
    text: `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00`,
  };
}

function nextDay(value: string) {
  const p = parseLocal(value)!;
  const d = new Date(Date.UTC(p.y, p.m - 1, p.d + 1));
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
}

function escape(text: string) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// Rader i iCalendar får vara högst 75 byte och viks med ett inledande mellanslag.
function fold(line: string) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = "";
  for (const ch of line) {
    if (new TextEncoder().encode(current + ch).length > (out.length ? 74 : 75)) {
      out.push(current);
      current = ch;
    } else current += ch;
  }
  out.push(current);
  return out.join("\r\n ");
}

export async function GET(req: Request) {
  const events = await getAllEvents();
  const host = new URL(req.url).host;
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ypsilon//Kalendarium//SV",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Ypsilon",
    "X-WR-TIMEZONE:Europe/Stockholm",
    "REFRESH-INTERVAL;VALUE=DURATION:PT6H",
    "BEGIN:VTIMEZONE",
    "TZID:Europe/Stockholm",
    "BEGIN:DAYLIGHT",
    "TZOFFSETFROM:+0100", "TZOFFSETTO:+0200", "TZNAME:CEST",
    "DTSTART:19700329T020000", "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
    "END:DAYLIGHT",
    "BEGIN:STANDARD",
    "TZOFFSETFROM:+0200", "TZOFFSETTO:+0100", "TZNAME:CET",
    "DTSTART:19701025T030000", "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
    "END:STANDARD",
    "END:VTIMEZONE",
  ];

  for (const e of events) {
    if (!parseLocal(e.starts_at)) continue;
    const start = icsLocal(e.starts_at);
    lines.push("BEGIN:VEVENT", `UID:event-${e.id}@${host}`, `DTSTAMP:${stamp}`);
    if (start.allDay) {
      lines.push(`DTSTART;VALUE=DATE:${start.text}`, `DTEND;VALUE=DATE:${nextDay(e.ends_at ?? e.starts_at)}`);
    } else {
      const end = e.ends_at && parseLocal(e.ends_at)?.hh != null ? icsLocal(e.ends_at) : icsLocal(e.starts_at, 3);
      lines.push(`DTSTART;TZID=Europe/Stockholm:${start.text}`, `DTEND;TZID=Europe/Stockholm:${end.text}`);
    }
    lines.push(`SUMMARY:${escape(e.title)}`);
    if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
    if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
    if (e.link) lines.push(`URL:${escape(e.link)}`);
    lines.push("END:VEVENT");
  }
  lines.push("END:VCALENDAR");

  return new Response(lines.map(fold).join("\r\n") + "\r\n", {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": 'inline; filename="ypsilon.ics"',
      "cache-control": "public, max-age=900",
    },
  });
}
