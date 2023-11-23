import React, { useRef, useEffect, useState } from 'react';
import { IoIosChatboxes } from 'react-icons/io';
import Dropdown from 'react-bootstrap/Dropdown';
import Image from 'react-bootstrap/Image';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
    setCurrentChatRoom,
    setPrivateChatRoom
} from './js/action/chatRoom_action';
import { setPhotoURL } from './js/action/user_action';
import { getDatabase, ref, update, onChildAdded } from "firebase/database";
import { getAuth, signOut, updateProfile } from "firebase/auth";
import { getStorage, ref as strRef, getDownloadURL, uploadBytesResumable } from "firebase/storage";

import './style.css';
import Logo from './img/C&Clogo.png';

const People = () => {
    const user = useSelector(state => state.user.currentUser);
    const dispatch = useDispatch();
    const inputOpenImageRef = useRef();
    const [users, setUsers] = useState([]);
    const [activeChatRoom, setActiveChatRoom] = useState("");

    useEffect(() => {
        if (user) {
            addUsersListeners(user.uid);
        }
    }, [user]);

    const addUsersListeners = (currentUserId) => {
        const usersRef = ref(getDatabase(), "users");
        let usersArray = [];

        onChildAdded(usersRef, (DataSnapshot) => {
            if (currentUserId !== DataSnapshot.key) {
                let user = DataSnapshot.val();
                user["uid"] = DataSnapshot.key;
                user["status"] = "offline";
                usersArray.push(user);
                setUsers(usersArray);
            }
        });
    }

    const getChatRoomId = (userId) => {
        const currentUserId = user.uid;

        return userId > currentUserId
            ? `${userId}/${currentUserId}`
            : `${currentUserId}/${userId}`;
    }

    const changeChatRoom = (user) => {
        const chatRoomId = getChatRoomId(user.uid);
        const chatRoomData = {
            id: chatRoomId,
            name: user.name
        };

        dispatch(setCurrentChatRoom(chatRoomData));
        dispatch(setPrivateChatRoom(true));
        setActiveChatRoom(user.uid);
    }

    const handleLogout = () => {
        const auth = getAuth();
        signOut(auth).then(() => {
            // Sign-out successful.
        }).catch((error) => {
            // An error happened.
        });
    }

    const handleOpenImageRef = () => {
        inputOpenImageRef.current.click();
    }

    const handleUploadImage = async (event) => {
        const file = event.target.files[0];
        const auth = getAuth();
        const user = auth.currentUser;

        const metadata = { contentType: file.type };
        const storage = getStorage();

        try {
            // 스토리지에 파일 저장하기
            let uploadTask = uploadBytesResumable(strRef(storage, `user_image/${user.uid}`), file, metadata);

            uploadTask.on('state_changed', (snapshot) => {
                // Get task progress, including the number of bytes uploaded and the total number of bytes to be uploaded
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                switch (snapshot.state) {
                    case 'paused':
                        console.log('Upload is paused');
                        break;
                    case 'running':
                        console.log('Upload is running');
                        break;
                }
            }, (error) => {
                // Handle errors during upload
                console.error(error);
            }, () => {
                // Handle successful upload
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                    // Update the user's profile image
                    updateProfile(user, {
                        photoURL: downloadURL
                    });

                    dispatch(setPhotoURL(downloadURL));

                    // Update the user's image in the database
                    update(ref(getDatabase(), `users/${user.uid}`), { image: downloadURL });
                });
            });
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <React.Fragment>
            <div className="P-body">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <header className="header">
                    <h1 className="header-title">친구</h1>
                    <div className="header-icons">
                        <span>
                            <Link to="#" className="custom-link">
                                <i className="fas fa-search fa-lg"></i>
                            </Link>
                        </span>
                        <span>
                            <Link to="/Set" className="custom-link">
                                <i className="fas fa-cog fa-lg"></i>
                            </Link>
                        </span>
                    </div>
                </header>
                <main className="people">
                    <a href="##">
                        <div className="me">
                            <Image src={user && user.photoURL} className="M-img" roundedCircle />
                            <div className="me-column">
                                <div id="my-data">
                                    {user && user.displayName}
                                </div>
                                <div className="textline_for">
                                    Capstone
                                </div>
                            </div>
                        </div>
                    </a>
                    <div className="friends-screen">
                        <div className="friends-screen-header">
                            <span>친구</span>
                            <i className="fas fa-chevron-up fa-xs"></i>
                        </div>
                        <a href="##">
                            <div className="friends">
                                <img src={Logo} alt="bot img" className="F-img" />
                                <div className="friends-column">
                                    <h4 className="friends-name">교육 봇</h4>
                                    <span className="friends-textline">
                                        <div className="textline_for">**회사 교육 도우미입니다! 많은 질문 부탁 드려요!</div>
                                    </span>
                                </div>
                            </div>
                        </a>
                        {users.length > 0 && users.map(user => (
                            <a href="##">
                                <div className="friends">
                                    <img src={Logo} alt="friend img" className="F-img" />
                                    <div className="friends-column">
                                        <h4 className="friends-name">{user.name}</h4>
                                        <span className="friends-textline">
                                            <div className="textline_for">언제나 신나게</div>
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                </main>
                <nav className="nav">
                    <ul className="nav-list">
                        <li className="tab-bar__btn">
                            <Link to="/" className="nav-tab--selected">
                                <i className="fas fa-user fa-2x"></i>
                            </Link>
                        </li>
                        <li className="tab-bar__btn">
                            <Link to="/Chat" className="nav-tab">
                                <i className="fas fa-comment fa-2x"></i>
                            </Link>
                        </li>
                        <li className="tab-bar__btn">
                            <Link to="/More" className="nav-tab">
                                <i className="fas fa-ellipsis-h fa-2x"></i>
                            </Link>
                        </li>
                    </ul>
                </nav>
                <div id="splash-screen">
                    <img src={Logo} alt="C&C 로고" />
                </div>
                <div id="no-mobile">
                    <span>화면이 너무 큽니다.</span>
                </div>
            </div>
        </React.Fragment>
    );
};

export default People;