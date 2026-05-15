"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { Post } from "./Post";
import { PostSkeleton } from "./PostSkeleton";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FeedProps {
  userId: string;
}

export function Feed({ userId }: FeedProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { ref, inView } = useInView();
  
  // 👇 Use ref to prevent multiple simultaneous requests
  const loadingRef = useRef(false);

  const loadPosts = useCallback(
    async (reset = false) => {
      // Prevent duplicate requests
      if (loadingRef.current) return;
      if (!reset && !hasMore) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const currentPage = reset ? 1 : page;
        const offset = (currentPage - 1) * 5;
        
        console.log(`📡 Fetching posts: page=${currentPage}, offset=${offset}`);
        
        const response = await fetch(`/api/posts?limit=5&offset=${offset}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ API Error:', response.status, errorText);
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }

        const newPosts = await response.json();
        console.log(`✅ Loaded ${newPosts.length} posts`);

        if (newPosts.length < 5) {
          setHasMore(false);
        }

        setPosts((prev) => (reset ? newPosts : [...prev, ...newPosts]));
        if (!reset) {
          setPage((prev) => prev + 1);
        }
      } catch (error) {
        console.error("❌ Failed to load posts:", error);
        setError(error instanceof Error ? error.message : "Failed to load posts");
        toast.error("Failed to load posts");
      } finally {
        setLoading(false);
        setInitialLoading(false);
        loadingRef.current = false;
      }
    },
    [page, hasMore] // 👈 Remove loading from dependencies
  );

  // 👇 Load initial posts only once
  useEffect(() => {
    loadPosts(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 👇 Load more when scrolling
  useEffect(() => {
    if (inView && !initialLoading && !loading && hasMore && !error) {
      loadPosts();
    }
  }, [inView]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePostUpdate = (updatedPost: any) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
  };

  const handlePostDelete = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    toast.success("Post removed from feed");
  };

  // 👇 Add this function to handle new posts
  const handleNewPost = (newPost: any) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    );
  }

  if (error && posts.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
        <h3 className="text-xl font-semibold mb-2">Something went wrong</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={() => {
          setPage(1);
          setHasMore(true);
          loadPosts(true);
        }}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
          <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
          <p className="text-gray-500">
            Create your first post or follow some users!
          </p>
        </div>
      ) : (
        posts.map((post) => (
          <Post
            key={post.id}
            post={post}
            currentUserId={userId}
            onUpdate={handlePostUpdate}
            onDelete={handlePostDelete}
          />
        ))
      )}

      {loading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
        </div>
      )}

      {hasMore && !loading && posts.length > 0 && (
        <div ref={ref} className="h-10" />
      )}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-gray-500 py-4">
          You've reached the end! 🎉
        </p>
      )}
    </div>
  );
}