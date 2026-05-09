import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import styles from "../styles/videoComponent.module.css";
import server from '../environment';

const server_url = server;
var connections = {};

export default function VideoMeetComponent() {

const socketRef = useRef();  
const socketIdRef = useRef();  
const localVideoref = useRef();  

const [video, setVideo] = useState(false);  
const [audio, setAudio] = useState(false);  
const [screen, setScreen] = useState(false);  
const [askForUsername, setAskForUsername] = useState(true);  
const [username, setUsername] = useState("");  
const [messages, setMessages] = useState([]);  
const [message, setMessage] = useState("");  
const [newMessages, setNewMessages] = useState(0);  
const [showModal, setModal] = useState(true);  
const [videos, setVideos] = useState([]);  

const getPermissions = async () => {  
    try {  
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });  
        window.localStream = stream;  
        if (localVideoref.current) {  
            localVideoref.current.srcObject = stream;  
        }  
    } catch (err) {  
        console.log(err);  
    }  
};  

const getUserMedia = () => {  
    navigator.mediaDevices.getUserMedia({ video, audio })  
        .then(stream => {  
            window.localStream = stream;  
            localVideoref.current.srcObject = stream;  
            for (let id in connections) {  
                if (id === socketIdRef.current) continue;  
                connections[id].addStream(stream);  
                connections[id].createOffer().then(description => {  
                    connections[id].setLocalDescription(description).then(() => {  
                        socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));  
                    });  
                });  
            }  
        });  
};  

const getDisplayMedia = () => {  
    navigator.mediaDevices.getDisplayMedia({ video: true })  
        .then(stream => {  
            window.localStream = stream;  
            localVideoref.current.srcObject = stream;  
            for (let id in connections) {  
                if (id === socketIdRef.current) continue;  
                connections[id].addStream(stream);  
                connections[id].createOffer().then(description => {  
                    connections[id].setLocalDescription(description).then(() => {  
                        socketRef.current.emit("signal", id, JSON.stringify({ sdp: connections[id].localDescription }));  
                    });  
                });  
            }  
        }) 
        .catch (() => {
            setScreen(false);
        }); 
};  

const gotMessageFromServer = (fromId, message) => {  
    var signal = JSON.parse(message);  
    if (fromId !== socketIdRef.current) {  
        if (signal.sdp) {  
            connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {  
                if (signal.sdp.type === "offer") {  
                    connections[fromId].createAnswer().then(description => {  
                        connections[fromId].setLocalDescription(description).then(() => {  
                            socketRef.current.emit("signal", fromId, JSON.stringify({ sdp: connections[fromId].localDescription }));  
                        });  
                    });  
                }  
            });  
        }  
        if (signal.ice) {  
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));  
        }  
    }  
};  

const connectToSocketServer = () => {  
    socketRef.current = io.connect(server_url);  

    socketRef.current.on("connect", () => {  
        socketIdRef.current = socketRef.current.id;  
        const path = window.location.pathname;  
        socketRef.current.emit("join-call", path);  
    });  

    socketRef.current.on("signal", gotMessageFromServer);  

    socketRef.current.on("chat-message", (data, sender, socketIdSender) => {  
        setMessages(prev => [...prev, { sender, data }]);  
        setNewMessages(prev => prev + 1);  
    });  

    socketRef.current.on("user-joined", (id, clients) => {  
        clients.forEach(socketListId => {  
            connections[socketListId] = new RTCPeerConnection({  
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }]  
            });  

            connections[socketListId].onicecandidate = (event) => {  
                if (event.candidate) {  
                    socketRef.current.emit("signal", socketListId, JSON.stringify({ ice: event.candidate }));  
                }  
            };  

            connections[socketListId].onaddstream = (event) => {  
                let videoExists = videos.find(v => v.socketId === socketListId);  
                if (!videoExists) {  
                    setVideos(prev => [...prev, { socketId: socketListId, stream: event.stream }]);  
                }  
            };  

            if (socketListId === socketIdRef.current) {  
                if (window.localStream) {  
                    connections[socketListId].addStream(window.localStream);  
                }  
            } else {  
                connections[socketListId].addStream(window.localStream);  
                connections[socketListId].createOffer().then(description => {  
                    connections[socketListId].setLocalDescription(description).then(() => {  
                        socketRef.current.emit("signal", socketListId, JSON.stringify({ sdp: connections[socketListId].localDescription }));  
                    });  
                });  
            }  
        });  
    });  

    socketRef.current.on("user-left", (id) => {  
        setVideos(prev => prev.filter(v => v.socketId !== id));  
    });  
};  

useEffect(() => {  
    getPermissions();  
}, []);  

useEffect(() => {  
    if (video || audio) getUserMedia();  
}, [video, audio]);  

useEffect(() => {  
    if (screen) getDisplayMedia();  
}, [screen]);  

const connect = () => {  
    setAskForUsername(false);  
    connectToSocketServer();  
    setTimeout(() => { getPermissions(); }, 300);  
};  

const handleEndCall = () => {  
    try {  
        let tracks = localVideoref.current.srcObject.getTracks();  
        tracks.forEach(track => track.stop());  
    } catch (e) { }  
    window.location.href = "/";  
};  

const sendMessage = () => {  
    socketRef.current.emit("chat-message", message, username);  
    setMessage("");  
};  

return (  
    <div style={{ margin: 0, padding: 0 }}>  
        {askForUsername ? (  
            <div style={{ padding: "2rem" }}>  
                <h2>Enter into Lobby</h2>  
                <TextField  
                    value={username}  
                    onChange={(e) => setUsername(e.target.value)}  
                    label="Username"  
                />  
                <Button variant="contained" onClick={connect}>Connect</Button>  
                <video ref={localVideoref} autoPlay muted style={{ width: "200px", height: "150px", marginTop: "1rem", display: "block" }} />  
            </div>  
        ) : (  
            <div className={styles.meetVideoContainer}>  

                {/* Left - video area */}  
                <div className={styles.conferenceView}>  
                    {videos.map((v) => (  
                        <video  
                            key={v.socketId}  
                            autoPlay  
                            className={styles.remoteVideo}  
                            ref={ref => {  
                                if (ref && v.stream) ref.srcObject = v.stream;  
                            }}  
                        />  
                    ))}  
                    {/* Apna PiP video */}  
                    <video  
                        className={styles.meetUserVideo}  
                        ref={localVideoref}  
                        autoPlay  
                        muted  
                    />  
                </div>  

                {/* Bottom controls */}  
                <div className={styles.buttonContainers}>  
                    <IconButton onClick={() => setVideo(!video)}>  
                        {video ? <VideocamIcon sx={{ color: 'white' }} /> : <VideocamOffIcon sx={{ color: 'white' }} />}  
                    </IconButton>  
                    <IconButton className={styles.endCallButton} onClick={handleEndCall}>  
                        <CallEndIcon />  
                    </IconButton>  
                    <IconButton onClick={() => setAudio(!audio)}>  
                        {audio ? <MicIcon sx={{ color: 'white' }} /> : <MicOffIcon sx={{ color: 'white' }} />}  
                    </IconButton>  
                    <IconButton onClick={() => setScreen(!screen)}>  
                        {screen ? <ScreenShareIcon sx={{ color: 'white' }} /> : <StopScreenShareIcon sx={{ color: 'white' }} />}  
                    </IconButton>  
                    <Badge badgeContent={newMessages} color="error">  
                        <IconButton onClick={() => { setModal(!showModal); setNewMessages(0); }}>  
                            <ChatIcon sx={{ color: 'white' }} />  
                        </IconButton>  
                    </Badge>  
                </div>  

                {/* Right - Chat panel - always visible */}  
                {showModal && (  
                    <div className={styles.chatRoom}>  
                        <div className={styles.chatContainer}>  
                            <h1>Chat</h1>  
                            <div className={styles.chattingDisplay}>  
                                {messages.length === 0 ? (  
                                    <p>No Messages Yet</p>  
                                ) : (  
                                    messages.map((msg, idx) => (  
                                        <div key={idx}>  
                                            <p><b>{msg.sender}</b>: {msg.data}</p>  
                                        </div>  
                                    ))  
                                )}  
                            </div>  
                            <div className={styles.chattingArea}>  
                                <TextField  
                                    value={message}  
                                    onChange={(e) => setMessage(e.target.value)}  
                                    label="Enter Your chat"  
                                    size="small"  
                                />  
                                <Button variant="contained" onClick={sendMessage}>SEND</Button>  
                            </div>  
                        </div>  
                    </div>  
                )}  

            </div>  
        )}  
    </div>  
);

}