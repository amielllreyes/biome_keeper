'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function Admin() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            alert('User data not found.');
            router.push('/');
            return;
          }

          const userData = userSnap.data();
          console.log('Role:', userData.role);

          if (userData.role !== 'admin') {
            alert('Access denied. Admins only.');
            router.push('/');
            return;
          }

          setCurrentUser(user);
          fetchUsers(); // ✅ Only fetch users if admin
        } catch (error) {
          console.error('Error fetching user data:', error);
          alert('Failed to verify role.');
          router.push('/');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersData: UserData[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          role: data.role,
        });
      });
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-50 p-8">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Admin Dashboard</h1>
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr className="bg-green-100 text-left">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="p-3">{user.name}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 capitalize">{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
