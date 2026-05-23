"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Menu, X, Home, Heart, MessageCircle, User, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";

export function MobileMenu() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-50">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-xl font-bold text-purple-600">SocialHub</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {isOpen && (
        <nav className="border-t border-gray-200 dark:border-gray-700 animate-slideInDown">
          <div className="flex flex-col">
            <Link
              href="/dashboard/user"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link
              href="/notifications"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <Heart className="h-5 w-5" />
              <span>Notifications</span>
            </Link>
            <Link
              href="/messages"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <MessageCircle className="h-5 w-5" />
              <span>Messages</span>
            </Link>
            <div className="border-t border-gray-200 dark:border-gray-700 my-2" />
            {session?.user ? (
              <Link
                href={`/profile/${session.user.username || session.user.email?.split('@')[0]}`}
                className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
                onClick={() => setIsOpen(false)}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
            ) : null}
            <Link
              href="/settings"
              className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-200 dark:border-gray-700"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            <button
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
