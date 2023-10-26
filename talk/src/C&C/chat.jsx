import React, { useState, useEffect } from 'react';
import { ref, getDatabase, onChildAdded, off, child, push, update, onValue } from "firebase/database";
import { connect } from 'react-redux';
import { setCurrentChatRoom, setPrivateChatRoom } from './js/action/chatRoom_action';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import { FaRegSmileWink, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import './style.css';
import Logo from './img/C&Clogo.png';

const Chat = (props) => {

    const currentChatRoom = useSelector(state => state.chatRoom.currentChatRoom)

    const [show, setShow] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [chatRoomsRef] = useState(ref(getDatabase(), "chatRooms"));
    const [messagesRef] = useState(ref(getDatabase(), "messages"));
    const [chatRooms, setChatRooms] = useState([]);
    const [firstLoad, setFirstLoad] = useState(true);
    const [activeChatRoomId, setActiveChatRoomId] = useState("");
    const [notifications, setNotifications] = useState([]);

    const setFirstChatRoom = () => {
        const firstChatRoom = chatRooms[0];
        if (firstLoad && chatRooms.length > 0) {
            props.dispatch(setCurrentChatRoom(firstChatRoom));
            setActiveChatRoomId(firstChatRoom.id);
        }
        setFirstLoad(false);
    };
    
    const addChatRoomsListeners = () => {
        let chatRoomsArray = [];
    
        onChildAdded(chatRoomsRef, (DataSnapshot) => {
            chatRoomsArray.push(DataSnapshot.val());
            setChatRooms(chatRoomsArray);
            addNotificationListener(DataSnapshot.key);
        });
    };
    
    const addNotificationListener = (chatRoomId) => {
        let { messagesRef } = this;
        onValue(child(messagesRef, chatRoomId), (DataSnapshot) => {
            if (props.chatRoom) {
                handleNotification(
                    chatRoomId,
                    props.chatRoom.id,
                    notifications,
                    DataSnapshot
                );
            }
        });
    };
    
    const handleNotification = (chatRoomId, currentChatRoomId, notifications, DataSnapshot) => {
        let lastTotal = 0;
    
        let index = notifications.findIndex((notification) =>
            notification.id === chatRoomId
        );
    
        if (index === -1) {
            notifications.push({
                id: chatRoomId,
                total: DataSnapshot.size,
                lastKnownTotal: DataSnapshot.size,
                count: 0,
            });
        } else {
            if (chatRoomId !== currentChatRoomId) {
                lastTotal = notifications[index].lastKnownTotal;
        
                if (DataSnapshot.size - lastTotal > 0) {
                    notifications[index].count = DataSnapshot.size - lastTotal;
                }
            }
            notifications[index].total = DataSnapshot.size;
        }
        setNotifications(notifications);
    };
    
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const { name, description } = this;
        if (isFormValid(name, description)) {
            addChatRoom();
        }
    };
    
    const addChatRoom = async () => {
        const key = push(chatRoomsRef).key;
        const { name, description } = this;
        const { user } = props;
        const newChatRoom = {
            id: key,
            name: name,
            description: description,
            createdBy: {
                name: user.displayName,
                image: user.photoURL,
            },
        };
    
        try {
            await update(child(chatRoomsRef, key), newChatRoom);
            setName("");
            setDescription("");
            setShow(false);
        } catch (error) {
            alert(error);
        }
    };
    
    const isFormValid = (name, description) => name && description;
    
    const changeChatRoom = (room) => {
        props.dispatch(setCurrentChatRoom(room));
        props.dispatch(setPrivateChatRoom(false));
        setActiveChatRoomId(room.id);
    };
    
    const getNotificationCount = (room) => {
        let count = 0;
        notifications.forEach((notification) => {
            if (notification.id === room.id) {
                count = notification.count;
            }
        });
        if (count > 0) return count;
    };
    
    const renderChatRooms = (chatRooms) =>
        chatRooms.length > 0 &&
        chatRooms.map((room) => (
            <li
                key={room.id}
                style={{
                    backgroundColor:
                    room.id === activeChatRoomId && "#ffffff45",
                }}
                onClick={() => changeChatRoom(room)}
            >
                # {room.name}
                <Badge style={{ float: "right", marginTop: "4px" }} variant="danger">
                    {getNotificationCount(room)}
                </Badge>
            </li>
        ));
    
    useEffect(() => {
        setFirstChatRoom();
        addChatRoomsListeners();
    }, []);

    return (
        <React.Fragment>
            <div className="C-body">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <header className="header">
                    <h1 className="header-title">채팅</h1>
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
                <main className="chat">
                    <ul style={{ listStyleType: "none", padding: 0 }}>
                        {/* 채팅 방 목록 */}
                        {chatRooms.map((room) => (
                            // 각 채팅 방 항목
                            <li
                                key={room.id}
                                style={{
                                    backgroundColor: room.id === activeChatRoomId && "#ffffff45",
                                }}
                            >
                                <Link to="/Chatroom">
                                    # {room.name}
                                    <Badge style={{ float: "right", marginTop: "4px" }} variant="danger">
                                        {getNotificationCount(room)}
                                    </Badge>
                                </Link>
                            </li>
                        ))}
                    </ul>
                    <Link to="/Chatroom">
                        <div className="chat__section-row">
                            <img src={Logo} alt="Profile" />
                            <div className="chat__section-column">
                                <h4 className="chat__section-name">교육 봇</h4>
                                <span className="chat__section-textline">
                                    <div className="chat__textline_for">
                                        요청 하신 자료는 현재 2건 있습니다....
                                    </div>
                                </span>
                            </div>
                            <div className="new_chat">
                                <h6 className="time">23:22</h6>
                                <div className="badge">1</div>
                            </div>
                        </div>
                    </Link>
                    <a href="#">
                        <div className="chat__section-row">
                            <img src={Logo} alt="Profile" />
                            <div className="chat__section-column">
                                <h4 className="chat__section-name">##</h4>
                                <span className="chat__section-textline">
                                    <div className="chat__textline_for">
                                        ##
                                    </div>
                                </span>
                            </div>
                            <div className="new_chat">
                                <h6 className="time">21:22</h6>
                                <div className="badge">1</div>
                            </div>
                        </div>
                    </a>
                    <a href="#">
                        <div className="chat__section-row">
                            <img src={Logo} alt="Profile" />
                            <div className="chat__section-column">
                                <h4 className="chat__section-name">**</h4>
                                <span className="chat__section-textline">
                                    <div className="chat__textline_for">
                                        **
                                    </div>
                                </span>
                            </div>
                            <div className="new_chat">
                                <h6 className="time">12:04</h6>
                                <div className="badge">1</div>
                            </div>
                        </div>
                    </a>
                    <Link to="/Chatplus">
                        <div className="chat-plus">
                            <FaPlus className="plus-btn" onClick={handleShow} />
                        </div>
                    </Link>
                </main>
                <nav className="nav">
                    <ul className="nav-list">
                        <li className="tab-bar__btn">
                            <Link to="/" className="nav-tab">
                                <i className="fas fa-user fa-2x"></i>
                            </Link>
                        </li>
                        <li className="tab-bar__btn">
                            <Link to="/Chat" className="nav-tab--selected">
                                <span className="nav-notification badge">3</span>
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
                <div id="no-mobile">
                    <span>화면이 너무 큽니다.</span>
                </div>
            </div>
        </React.Fragment>
    );
};

export default Chat;