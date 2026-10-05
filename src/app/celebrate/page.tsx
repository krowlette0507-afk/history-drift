import { redirect } from "next/navigation";

// /celebrate with no token — redirect to sign-in for the host to log in
export default function CelebratePage() {
  redirect("/sign-in");
}
