import React, { useState, useRef, useEffect } from 'react';
import moment from 'moment';
import { Link } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import firebase from '../firebase';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentChatRoom } from './js/action/chatRoom_action';

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
    const currentUser = useSelector(state => state.user.currentUser);
    const [content, setContent] = useState("");
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [percentage, setPercentage] = useState(0);
    const messagesRef = ref(getDatabase(), "messages");
    const inputOpenImageRef = useRef();
    const typingRef = ref(getDatabase(), "typing");
    const isPrivateChatRoom = useSelector(state => state.chatRoom.isPrivateChatRoom);

    const handleChange = (event) => {
        setContent(event.target.value);
    }

    const createMessage = (fileUrl = null) => {
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
                await set(newMessageRef, createMessage());

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
                    switch (snapshot.state) {
                        case 'paused':
                            console.log('Upload is paused');
                            break;
                        case 'running':
                            console.log('Upload is running');
                            break;
                    }
                },
                (error) => {
                    switch (error.code) {
                        case 'storage/unauthorized':
                            break;
                        case 'storage/canceled':
                            break;
                        case 'storage/unknown':
                            break;
                    }
                },
                () => {
                    getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                        if (chatRoom && chatRoom.id) {
                            const newMessageRef = push(child(messagesRef, chatRoom.id));
                            set(newMessageRef, createMessage(downloadURL));
                        }
                        setLoading(false);
                    });
                }
            );
        } catch (error) {
            console.log(error);
        }
    };

    const handleKeyDown = (event) => {
        if (event.ctrlKey && event.keyCode === 13) {
            handleSubmit();
        }

        if (currentUser && currentUser.uid && content) {
            set(ref(getDatabase(), `typing/${chatRoom.id}/${currentUser.uid}`), {
                userUid: currentUser.uid,
            });
        } else {
            remove(ref(getDatabase(), `typing/${chatRoom.id}/${currentUser.uid}`));
        }
    };

    const timeFromNow = (timestamp) => moment(timestamp).fromNow();

    const isImage = (message) => {
        return message.hasOwnProperty("image") && !message.hasOwnProperty("content");
    };

    const isMessageMine = (message, currentUser) => {
        if (currentUser) {
            return message.user.id === currentUser.uid;
        }
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
                        {chatRoom ? chatRoom.name : 'Chat Room Name'}
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
                        {message && currentUser && (
                            <div style={{ marginBottom: '3px', display: 'flex' }}>
                                <img
                                    style={{ borderRadius: '50%' }}
                                    width={48}
                                    height={48}
                                    className="mr-3"
                                    src={message.user.image}
                                    alt={message.user.name}
                                />
                                <div style={{
                                    backgroundColor: isMessageMine(message, currentUser) && "#ECECEC"
                                }}>
                                    <h6>{message.user.name}{" "}
                                        <span style={{ fontSize: '10px', color: 'gray' }}>
                                            {timeFromNow(message.timestamp)}
                                        </span>
                                    </h6>
                                    {isImage(message) ?
                                        <img style={{ maxWidth: '300px' }} alt="이미지" src={message.image} />
                                        :
                                        <p>
                                            {message.content}
                                        </p>
                                    }
                                </div>
                            </div>
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