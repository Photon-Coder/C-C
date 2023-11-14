import {
    SET_CURRENT_CHAT_ROOM,
    SET_PRIVATE_CHAT_ROOM,
    SET_USER_POSTS
} from './types';

export const setCurrentChatRoom = (chatRoom) => {
    return {
        type: SET_CURRENT_CHAT_ROOM,
        payload: chatRoom,
    }
}

export function setPrivateChatRoom(isPrivateChatRoom) {
    return {
        type: SET_PRIVATE_CHAT_ROOM,
        payload: isPrivateChatRoom
    }
}


export function setUserPosts(userPosts) {
    return {
        type: SET_USER_POSTS,
        payload: userPosts
    }
}
