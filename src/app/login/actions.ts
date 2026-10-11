"use server";

import { redirect } from "next/navigation";
import { login } from "@/lib/auth";

type LoginState = { error: string; email: string } | null;

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { error: "Fyll i e-post och lösenord.", email };
  const error = await login(email, password);
  // E-postadressen skickas tillbaka så att fältet inte töms efter ett felaktigt lösenord.
  if (error) return { error, email };
  redirect("/admin");
}
