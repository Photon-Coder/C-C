import React, { useState, useRef, useEffect } from 'react';
import moment from 'moment';
import { Link, useLocation } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Badge from 'react-bootstrap/Badge';
import firebase from '../firebase';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentChatRoom, setPrivateChatRoom } from './js/action/chatRoom_action';

import {
    getDatabase,
    ref,
    set,
    push,
    remove,
    child,
} from "firebase/database";
import {
    getStorage,
    ref as strRef,
    uploadBytesResumable,
    getDownloadURL,
} from "firebase/storage";

import './style.css';
import Logo from './img/C&Clogo.png';

const Chatroom = ({ message }) => {
    const dispatch = useDispatch();
    const chatRoom = useSelector(state => state.chatRoom.currentChatRoom);
    const [chatRoomName, setChatRoomName] = useState('');
    const currentUser = useSelector(state => state.user.currentUser);
    const [content, setContent] = useState("");
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [percentage, setPercentage] = useState(0);
    const messagesRef = ref(getDatabase(), "messages");
    const inputOpenImageRef = useRef();
    const typingRef = ref(getDatabase(), "typing");
    const isPrivateChatRoom = useSelector(state => state.chatRoom.isPrivateChatRoom);
    const [activeChatRoomId, setActiveChatRoomId] = useState("");
    const [notifications, setNotifications] = useState([]);
    const [chatRoomInfo, setChatRoomInfo] = useState(null);
    const [show, setShow] = useState(false);
    const location = useLocation();
    const newMessageRef = chatRoom ? push(child(messagesRef, chatRoom.id)) : null;

    const handleChange = (event) => {
        setContent(event.target.value);
    }

    const createMessage = async (fileUrl = null) => {
        const message = {
            timestamp: new Date(),
            user: {
                id: currentUser ? currentUser.uid : null,
                name: currentUser ? currentUser.displayName : null,
                image: currentUser ? currentUser.photoURL : null,
            },
        };

        if (fileUrl !== null) {
            message["image"] = fileUrl;
        } else {
            message["content"] = content;
        }

        return message;
    };

    const getNotificationCount = (room) => {
        let count = 0;
        notifications.forEach((notification) => {
            if (notification.id === room.id) {
                count = notification.count;
            }
        });
        return count;
    };

    const changeChatRoom = (room) => {
        dispatch(setCurrentChatRoom(room));
        dispatch(setPrivateChatRoom(false));
        setActiveChatRoomId(room.id);
    };

    useEffect(() => {
        // 페이지가 처음 로드될 때 채팅방 이름을 가져와 state에 설정
        if (location.state && location.state.chatRoomName) {
            console.log('Setting chatRoomName from location state:', location.state.chatRoomName);
            setChatRoomName(location.state.chatRoomName);
        }
    }, [location]);

    const renderChatRooms = (Chatroom) =>
        Chatroom.length > 0 &&
        Chatroom.map((room) => (
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
        dispatch(setCurrentChatRoom({ id: 'chatRoomId', name: 'Chat Room Name' }));
    }, [dispatch]);

    const handleSubmit = async () => {
        if (!content) {
            setErrors((prev) => prev.concat("Type contents first"));
            return;
        }
        setLoading(true);

        try {
            if (chatRoom && chatRoom.id) {
                const newMessageRef = push(child(messagesRef, chatRoom.id));
                await set(newMessageRef, await createMessage());

                await remove(child(typingRef, `${chatRoom.id}/${currentUser.uid}`));
                setLoading(false);
                setContent("");
                setErrors([]);
            } else {
                setLoading(false);
                setErrors((prev) => prev.concat("Chat room is not selected."));
            }
        } catch (error) {
            setErrors((prev) => prev.concat(error.message));
            setLoading(false);
            setTimeout(() => {
                setErrors([]);
            }, 5000);
        }
    };

    const handleOpenImageRef = () => {
        inputOpenImageRef.current.click();
    };

    const getPath = () => {
        if (isPrivateChatRoom) {
            return `/message/private/${chatRoom.id}`;
        } else {
            return `/message/public`;
        }
    };

    const handleUploadImage = (event) => {
        const file = event.target.files[0];
        const storage = getStorage();

        const filePath = `${getPath()}/${file.name}`;
        console.log('filePath', filePath);
        const metadata = { contentType: file.type };
        setLoading(true);

        try {
            const storageRef = strRef(storage, filePath);
            const uploadTask = uploadBytesResumable(storageRef, file, metadata);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log('Upload is ' + progress + '% done');
                    setPercentage(progress);
                },
                (error) => {
                    setErrors([error.message]);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        if (chatRoom && chatRoom.id) {
                            const newMessageRef = push(child(messagesRef, chatRoom.id));
                            set(newMessageRef, createMessage(downloadURL));
                        }
                        setLoading(false);
                        setPercentage(0);
                    } catch (error) {
                        setErrors([error.message]);
                        setLoading(false);
                    }
                }
            );
        } catch (error) {
            setErrors([error.message]);
        }
    };

    const handleKeyDown = (event) => {
        if (event.ctrlKey && event.keyCode === 13) {
            handleSubmit();
        }

        if (currentUser && currentUser.uid && content && chatRoom && chatRoom.id) {
            set(ref(getDatabase(), `typing/${chatRoom.id}/${currentUser.uid}`), {
                userUid: currentUser.uid,
            });
        } else {
            // Handle the case where chatRoom is not defined
            console.error('Chat room is not selected.');
        }
    };

    const handleShow = () => {
        setShow(true);
        // 채팅방 이름 설정 코드 추가
        if (location && location.state) {
            setChatRoomName(location.state.chatRoomName || '');
        }
    };

    const handleClose = () => setShow(false);

    const timeFromNow = (timestamp) => moment(timestamp).fromNow();

    const isImage = (message) => {
        return message?.hasOwnProperty("image") && !message?.hasOwnProperty("content");
    };

    const isMessageMine = (message, currentUser) => {
        return currentUser && message?.user?.id === currentUser.uid;
    };

    return (
        <React.Fragment>
            <div className="CR-body">
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
                <header className="header">
                    <span className="wrapper">
                        <Link to="/Chat" className="back-link">
                            <i className="fa fa-chevron-left fa-2x"></i>
                        </Link>
                    </span>
                    <h1 className="header-title">
                        {chatRoom?.name || chatRoomName}
                    </h1>
                    <div className="header-icons">
                        <span>
                            <i className="fas fa-search fa-lg"></i>
                        </span>
                        <span>
                            <i className="fas fa-cog fa-lg"></i>
                        </span>
                    </div>
                </header>
                <main className="chats">
                    <div className="chat-board">
                        {message && currentUser && message.user && (
                            <ul className={isMessageMine(message, currentUser) ? "chatlist-me" : "chatlist-you"}>
                                <li className="chats_chat">
                                    <div className="chats-content">
                                        <div className="chat-priview">
                                            <h3 className={isMessageMine(message, currentUser) ? "chatuser-me" : "chatuser-you"}>
                                                {message.user.name}
                                            </h3>
                                            <span className={isMessageMine(message, currentUser) ? "chat-last-message-me" : "chat-last-message-you"}>
                                                {isImage(message) ? "이미지" : message.content}
                                            </span>
                                        </div>
                                        {isMessageMine(message, currentUser) && (
                                            <img
                                                src={message.user.image}
                                                className={isMessageMine(message, currentUser) ? "img-me" : "img-you"}
                                                alt={message.user.name}
                                            />
                                        )}
                                    </div>
                                    <span className={isMessageMine(message, currentUser) ? "chat-date-time-me" : "chat-date-time-you"}>
                                        {timeFromNow(message.timestamp)}
                                    </span>
                                </li>
                            </ul>
                        )}

                        {chatRoomInfo && (
                            <ul className={isMessageMine(message, currentUser) ? "chatlist-me" : "chatlist-you"}>
                                <li className="chats_chat">
                                    <div className="chats-content">
                                        {/* 사용자에 따라 이미지를 변경 */}
                                        <img src={isMessageMine(message, currentUser) ? currentUser.photoURL : message.user.image} className={isMessageMine(message, currentUser) ? "img-me" : "img-you"} />
                                        <div className="chat-priview">
                                            {/* 사용자에 따라 클래스를 변경하여 스타일 적용 */}
                                            <h3 className={isMessageMine(message, currentUser) ? "chatuser-me" : "chatuser-you"}>
                                                {isMessageMine(message, currentUser) ? currentUser.displayName : message.user.name}
                                            </h3>
                                            <span className={isMessageMine(message, currentUser) ? "chat-last-message-me" : "chat-last-message-you"}>
                                                {content}
                                            </span>
                                        </div>
                                    </div>
                                    <span className={isMessageMine(message, currentUser) ? "chat-date-time-me" : "chat-date-time-you"}>
                                        {moment().fromNow()}
                                    </span>
                                </li>
                            </ul>
                        )}
                    </div>

                    <ul className="chatlist-me">
                        <li className="chats_chat">
                            <div className="chats-content">
                                <div className="chat-priview">
                                    <h3 className="chatuser-me">
                                        사자
                                    </h3>
                                    <span className="chat-last-message-me">
                                        Hi
                                    </span>
                                </div>
                            </div>
                            <span className="chat-date-time-me">
                                08:55
                            </span>
                        </li>
                    </ul>
                    <ul className="chatlist-you">
                        <li className="chats_chat">
                            <div className="chats-content">
                                <img src={Logo} className="img-you" />
                                <div className="chat-priview">
                                    <h3 className="chatuser-you">
                                        호랑이
                                    </h3>
                                    <span className="chat-last-message-you">
                                        Bye
                                    </span>
                                </div>
                            </div>
                            <span className="chat-date-time-you">
                                05:45
                            </span>
                        </li>
                    </ul>
                </main>
                <nav className="CR-nav">
                    <div className='uploadbtn'>
                        <Row>
                            <Col>
                                <button
                                    onClick={handleOpenImageRef}
                                    className="upload"
                                    disabled={loading ? true : false}
                                >
                                    사진
                                </button>
                            </Col>
                        </Row>
                    </div>
                    
                    <div className='formchat'>
                        <Form onSubmit={handleSubmit}>
                            <Form.Group controlId="exampleForm.ControlTextarea1">
                                <Form.Control
                                    onKeyDown={handleKeyDown}
                                    value={content}
                                    className="form"
                                    onChange={handleChange}
                                    as="textarea"
                                    rows={3} />
                            </Form.Group>
                        </Form>
                    </div>
                    {
                        !(percentage === 0 || percentage === 100) &&
                        <ProgressBar variant="warning" label={`${percentage}%`} now={percentage} />
                    }

                    <div>
                        {errors.map(errorMsg => <p style={{ color: 'red' }} key={errorMsg}>
                            {errorMsg}
                        </p>)}
                    </div>
                    
                    <div className='sendbtn'>
                        <Row>
                            <Col>
                                <button
                                    onClick={handleSubmit}
                                    className="send"
                                    disabled={loading ? true : false}
                                >
                                    보내기
                                </button>
                            </Col>
                        </Row>
                    </div>

                    <input
                        accept="image/jpeg, image/png"
                        style={{ display: 'none' }}
                        type="file"
                        ref={inputOpenImageRef}
                        onChange={handleUploadImage}
                    />
                </nav>

                <div id="no-mobile">
                    <span>화면이 너무 큽니다.</span>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Chatroom;