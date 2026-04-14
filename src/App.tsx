import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import GuestOnlyRoute from './components/GuestOnlyRoute';
import RequireAuth from './components/RequireAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Packages from './pages/Packages';
import Control from './pages/Control';
import Profile from './pages/Profile';
import Booking from './pages/Booking';
import BookingSuccess from './pages/BookingSuccess';
import Feedback from './pages/Feedback';
import Orders from './pages/Orders';
import Membership from './pages/Membership';
import Recharge from './pages/Recharge';
import Notifications from './pages/Notifications';
import ForgotPassword from './pages/ForgotPassword';

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<GuestOnlyRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route path="/" element={<Home />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/control" element={<Control />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/membership" element={<Membership />} />
          <Route path="/recharge" element={<Recharge />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
