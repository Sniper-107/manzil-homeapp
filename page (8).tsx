import { redirect } from "next/navigation";
import { getCurrentUserAndHousehold } from "@/lib/household";

export default async function Home() {
  const { user, household } = await getCurrentUserAndHousehold();

  if (!user) redirect("/login");
  if (!household) redirect("/onboarding");
  redirect("/dashboard");
}
