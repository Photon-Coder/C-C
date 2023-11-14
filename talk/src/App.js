import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from 'react-router-dom';

import Login from './C&C/login';
import Registration from './C&C/registration';
import People from './C&C/people';
import Chat from './C&C/chat';
import Chatplus from './C&C/chatplus';
import Chatroom from './C&C/chatroom';
import Set from './C&C/set';
import More from './C&C/more';

import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useDispatch, useSelector } from "react-redux";
import { setUser, clearUser } from "./C&C/js/action/user_action";

function App(props) {
  const navigate = useNavigate();
  let dispatch = useDispatch();
  const isLoading = useSelector((state) => state.user.isLoading);

  useEffect(() => {
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate("/");
        dispatch(setUser(user));

        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        const uid = user.uid;
        // ...
      } else {
        navigate("/Login");
        dispatch(clearUser());
        // User is signed out
        // ...
      }
    });

    // Cleanup function to unsubscribe when the component unmounts
  }, []);

  if (isLoading) {
    return <div>...loading</div>;
  } else {
    return (
      <Routes>
        <Route path="/Login" element={<Login />} />
        <Route path="/Registration" element={<Registration />} />
        <Route path="/" element={<People />} />
        <Route path="/Chat" element={<Chat />} />
        <Route path="/Chatplus" element={<Chatplus />} />
        <Route path="/Chatroom/:roomId" element={<Chatroom />} />
        <Route path="/Set" element={<Set />} />
        <Route path="/More" element={<More />} />
      </Routes>
    );
  }
}

export default App;