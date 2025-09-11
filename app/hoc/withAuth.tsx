"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEffect } from "react";
import { Loader } from "@/components/loader/loader";

export default function withAuth(Component: React.ComponentType<any>) {
  return function ProtectedRoute(props: any) {
    const { user, loading } = useAuth();
    const router = useRouter();

    // useEffect(() => {
    //   if (!loading && !user) {
    //     router.push(
    //       `/signin?redirect=${encodeURIComponent(window.location.pathname)}`
    //     );
    //   }
    // }, [user, loading, router]);

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader />
        </div>
      );
    }

    return <Component {...props} />;
  };
}
