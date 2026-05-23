"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Feed } from "./components/Feed";
import { Stories } from "./components/Stories";
import { Sidebar } from "./components/Sidebar";
import { CreatePost } from "./components/CreatePost";
import { TrendingSidebar } from "./components/TrendingSidebar";

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const [feedKey, setFeedKey] = useState(0); // Used to force refresh if needed

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (!session) {
    redirect("/login");
  }

  const handlePostCreated = (newPost: any) => {
    // This will trigger the Feed component to update via the callback
    // The Feed component already has handleNewPost function
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block lg:col-span-3">
            <Sidebar user={session.user} />
          </div>

          {/* Main Content */}
          <div className="col-span-1 lg:col-span-6">
            <div className="hidden lg:block mb-6">
              <Stories />
            </div>
            <div className="hidden lg:block mb-6">
              <CreatePost user={session.user} onPostCreated={handlePostCreated} />
            </div>
            <Feed key={feedKey} userId={session.user.id} />
          </div>

          {/* Right Sidebar - Trending & Suggestions - Hidden on Mobile */}
          <div className="hidden lg:block lg:col-span-3">
            <TrendingSidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
