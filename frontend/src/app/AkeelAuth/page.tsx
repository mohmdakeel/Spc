"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";  // Using next/navigation for client-side navigation

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to /AkeelAuth/(public)/login
    router.push("/AkeelAuth/(public)/login");
  }, [router]);

  return (
    <div>
      Redirecting...
    </div>
  );
}
