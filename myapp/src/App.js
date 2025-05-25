import React, { useState, useEffect } from 'react';
import { database } from './firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import './App.css';

function App() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [users, setUsers] = useState([]);
  const [editId, setEditId] = useState(null);

  // Read data from Firebase
  useEffect(() => {
    const usersRef = ref(database, 'users');
    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const userList = data
        ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
        : [];
      setUsers(userList);
    });
  }, []);

  // Create or Update user
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !age || !sex) {
      alert('Please fill all fields');
      return;
    }

    const usersRef = ref(database, 'users');
    if (editId) {
      // Update existing user
      const userRef = ref(database, `users/${editId}`);
      update(userRef, { name, age, sex })
        .then(() => {
          setEditId(null);
          clearForm();
        })
        .catch((error) => console.error('Error updating user:', error));
    } else {
      // Create new user
      push(usersRef, { name, age, sex })
        .then(() => clearForm())
        .catch((error) => console.error('Error creating user:', error));
    }
  };

  // Edit user
  const handleEdit = (user) => {
    setName(user.name);
    setAge(user.age);
    setSex(user.sex);
    setEditId(user.id);
  };

  // Delete user
  const handleDelete = (id) => {
    const userRef = ref(database, `users/${id}`);
    remove(userRef).catch((error) => console.error('Error deleting user:', error));
  };

  // Clear form
  const clearForm = () => {
    setName('');
    setAge('');
    setSex('');
    setEditId(null);
  };

  return (
    <div className="App">
      <h1>User Management</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
        />
        <select value={sex} onChange={(e) => setSex(e.target.value)}>
          <option value="">Select Sex</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
        <button type="submit">{editId ? 'Update' : 'Add'} User</button>
        {editId && <button type="button" onClick={clearForm}>Cancel</button>}
      </form>

      <h2>Users List</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id}>
            {user.name}, {user.age}, {user.sex}
            <button onClick={() => handleEdit(user)}>Edit</button>
            <button onClick={() => handleDelete(user.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;