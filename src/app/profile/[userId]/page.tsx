'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';

interface UserProfile {
  id: string;
  name: string | null;
  image: string | null;
  email?: string | null; // Make optional if not always exposed
  wins: number;
  losses: number;
  draws: number;
  rating: number;
}

export default function ProfilePage() {
  const params = useParams();
  const userId = params?.userId as string | undefined;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('User ID not found in URL.');
      return;
    }

    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/users/${userId}/stats`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data: UserProfile = await response.json();
        setProfile(data);
      } catch (e: any) {
        console.error("Failed to fetch profile:", e);
        setError(e.message || 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [userId]);

  if (loading) {
    return <div className="container mx-auto p-4">Loading profile...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">Error: {error}</div>;
  }

  if (!profile) {
    return <div className="container mx-auto p-4">User profile not found.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden md:max-w-2xl p-8">
        <div className="flex items-center space-x-4">
          {profile.image && (
            <Image 
              src={profile.image}
              alt={profile.name || 'User avatar'}
              width={64} 
              height={64} 
              className="rounded-full"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.name || 'User Profile'}</h1>
        </div>
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-300">Stats</h2>
          <div className="grid grid-cols-2 gap-4 text-gray-600 dark:text-gray-400">
            <p><strong>Rating:</strong> {profile.rating}</p>
            <p><strong>Wins:</strong> {profile.wins}</p>
            <p><strong>Losses:</strong> {profile.losses}</p>
            <p><strong>Draws:</strong> {profile.draws}</p>
          </div>
        </div>
        {/* Optionally display email or other info if available */}
        {/* {profile.email && <p className="mt-4 text-gray-500">Email: {profile.email}</p>} */}
      </div>
    </div>
  );
} 