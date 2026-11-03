// src/features/auth/authThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import axiosInstance from '../../../config/axiosInstance';

// Basic config
axios.defaults.withCredentials = true;

// REGISTER
export const registerUser = createAsyncThunk('auth/register', async (formData, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/users/register', formData);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Registration failed');
  }
});

// LOGIN
export const loginUser = createAsyncThunk('auth/login', async (formData, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.post('/users/login', formData);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Login failed');
  }
});

// updateUser
export const updateUser = createAsyncThunk('auth/updateUser', async ({ userId, username }, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.put(`/users/user/${userId}`, { username });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Error updating user');
  }
});

// deleteUser
export const deleteUser = createAsyncThunk('auth/deleteUser', async (userId, { rejectWithValue }) => {
  try {
    await axiosInstance.delete(`/users/user/${userId}`);
    return userId;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Error deleting user');
  }
});

// getUser
export const getUser = createAsyncThunk('auth/getUser', async (userId, { rejectWithValue }) => {
  try {
    const res = await axiosInstance.get(`/users/user/${userId}`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || err.message || 'Error getting user details');
  }
});
