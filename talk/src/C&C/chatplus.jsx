import React, { useState, useEffect } from 'react';
import { ref, getDatabase, onChildAdded, push, update, onValue, child } from "firebase/database";
import { connect } from 'react-redux';
import { setCurrentChatRoom, setPrivateChatRoom } from './js/action/chatRoom_action';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Badge from 'react-bootstrap/Badge';
import { FaRegSmileWink, FaPlus } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const ChatPlus = (props) => {
    const [show, setShow] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const chatRoomsRef = ref(getDatabase(), "chatRooms");
    const messagesRef = ref(getDatabase(), "messages");
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
        onValue(child(messagesRef, chatRoomId), (DataSnapshot) => {
            if (props.chatRoom) {
                handleNotification(chatRoomId, props.chatRoom.id, notifications, DataSnapshot);
            }
        });
    };

    const handleNotification = (chatRoomId, currentChatRoomId, notifications, DataSnapshot) => {
        let lastTotal = 0;

        let index = notifications.findIndex((notification) => notification.id === chatRoomId);

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
        if (isFormValid(name, description)) {
            addChatRoom();
        }
    };

    const addChatRoom = async () => {
        const key = push(chatRoomsRef).key;
        const newChatRoom = {
            id: key,
            name: name,
            description: description,
            createdBy: {
                name: props.user.displayName,
                image: props.user.photoURL,
            },
        };
    
        try {
            await update(child(chatRoomsRef, key), newChatRoom);
            setName("");
            setDescription("");
            setShow(false);
            
            props.dispatch(setCurrentChatRoom(newChatRoom));
            // Chatroom 페이지로 이동 시에 채팅방 이름을 전달
            props.history.push({
                pathname: `/Chatroom/${newChatRoom.id}`,
                state: { chatRoomName: newChatRoom.name }
            });
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
        )
    );

    useEffect(() => {
        setFirstChatRoom();
        addChatRoomsListeners();
        handleShow();
    }, []);

    return (
        <React.Fragment>
            <div className="C-body">
                <header className="header">
                    <span className="wrapper">
                        <Link to="/Chat" className="back-link">
                            <i className="fa fa-chevron-left fa-2x"></i>
                        </Link>
                    </span>
                    <h1 className="header-title">채팅 추가</h1>
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
                <main className="new-chat">
                    <div>
                        <div show={show} onHide={handleClose}>
                            <Modal.Body>
                                <Form onSubmit={handleSubmit}>
                                    <Form.Group controlId="formBasicEmail">
                                        <div>방 이름</div>
                                        <Form.Control
                                            onChange={(e) => setName(e.target.value)}
                                            type="text"
                                            placeholder="Enter a chat room name"
                                        />
                                    </Form.Group>
                                    <Form.Group controlId="formBasicPassword">
                                        <div>방 설명</div>
                                        <Form.Control
                                            onChange={(e) => setDescription(e.target.value)}
                                            type="text"
                                            placeholder="Enter a chat room description"
                                        />
                                    </Form.Group>
                                </Form>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={handleClose}>
                                    <Link to="/Chat" className='close'>
                                        Close
                                    </Link>
                                </Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    <Link to="/Chatroom/${room.id}" className='create'>                                    
                                        Create
                                    </Link>
                                </Button>
                            </Modal.Footer>
                        </div>
                    </div>
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

const mapStateToProps = (state) => {
    return {
        user: state.user.currentUser,
        chatRoom: state.chatRoom.currentChatRoom,
    };
}

export default connect(mapStateToProps)(ChatPlus);