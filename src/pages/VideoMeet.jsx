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

    const [showModal, setModal] = useState(false);

    // ================= SOCKET =================
    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url);

        socketRef.current.on("connect", () => {
            socketIdRef.current = socketRef.current.id;
        });
    };

    // ================= MEDIA =================
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
            });
    };

    const getDisplayMedia = () => {
        navigator.mediaDevices.getDisplayMedia({ video: true })
            .then(stream => {
                window.localStream = stream;
                localVideoref.current.srcObject = stream;
            });
    };

    // ================= USE EFFECTS (FIXED) =================
    useEffect(() => {
        getPermissions();
    }, []);

    useEffect(() => {
        if (video || audio) {
            getUserMedia();
        }
    }, [video, audio]);

    useEffect(() => {
        if (screen) {
            getDisplayMedia();
        }
    }, [screen]);

    // ================= ACTIONS =================
    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    const handleEndCall = () => {
        window.location.href = "/";
    };

    const sendMessage = () => {
        setMessage("");
    };

    return (
        <div>

            {askForUsername ? (
                <div>
                    <h2>Enter Lobby</h2>

                    <TextField
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        label="Username"
                    />

                    <Button variant="contained" onClick={connect}>
                        Connect
                    </Button>

                    <video ref={localVideoref} autoPlay muted />
                </div>
            ) : (
                <div className={styles.meetVideoContainer}>

                    <video
                        className={styles.meetUserVideo}
                        ref={localVideoref}
                        autoPlay
                        muted
                    />

                    <div className={styles.buttonContainers}>

                        <IconButton onClick={() => setVideo(!video)}>
                            {video ? <VideocamIcon /> : <VideocamOffIcon />}
                        </IconButton>

                        <IconButton onClick={handleEndCall}>
                            <CallEndIcon />
                        </IconButton>

                        <IconButton onClick={() => setAudio(!audio)}>
                            {audio ? <MicIcon /> : <MicOffIcon />}
                        </IconButton>

                        <IconButton onClick={() => setScreen(!screen)}>
                            {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                        </IconButton>

                        <Badge badgeContent={newMessages}>
                            <IconButton onClick={() => setModal(!showModal)}>
                                <ChatIcon />
                            </IconButton>
                        </Badge>

                    </div>

                </div>
            )}

        </div>
    );
}