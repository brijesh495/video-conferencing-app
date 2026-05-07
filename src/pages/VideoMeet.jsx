import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { Badge, IconButton, TextField, Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare'
import ChatIcon from '@mui/icons-material/Chat'
import server from '../environment';

const server_url = server;

var connections = {};

const peerConfigConnections = {
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
}

export default function VideoMeetComponent() {

    const socketRef = useRef();
    const socketIdRef = useRef();
    const localVideoref = useRef();

    const [videoAvailable, setVideoAvailable] = useState(true);
    const [audioAvailable, setAudioAvailable] = useState(true);
    const [video, setVideo] = useState(false);
    const [audio, setAudio] = useState(false);
    const [screen, setScreen] = useState(false);

    const [messages, setMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [newMessages, setNewMessages] = useState(0);

    const [askForUsername, setAskForUsername] = useState(true);
    const [username, setUsername] = useState("");

    const [showModal, setModal] = useState(false);
    const [screenAvailable, setScreenAvailable] = useState(false);

    const [videos, setVideos] = useState([]);

    const videoRef = useRef([]);

    // ================= PERMISSIONS =================
    const getPermissions = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            await navigator.mediaDevices.getUserMedia({ audio: true });

            setVideoAvailable(true);
            setAudioAvailable(true);

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            }

        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        getPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ================= MEDIA =================
    const getUserMedia = () => {
        navigator.mediaDevices.getUserMedia({
            video: video,
            audio: audio
        }).then(stream => {
            window.localStream = stream;
            if (localVideoref.current) {
                localVideoref.current.srcObject = stream;
            }
        });
    };

    useEffect(() => {
        if (video || audio) {
            getUserMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [video, audio]);

    // ================= SCREEN SHARE =================
    const getDisplayMedia = () => {
        navigator.mediaDevices.getDisplayMedia({ video: true })
            .then(stream => {
                window.localStream = stream;
                localVideoref.current.srcObject = stream;
            });
    };

    useEffect(() => {
        if (screen) {
            getDisplayMedia();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [screen]);

    // ================= SOCKET =================
    const connectToSocketServer = () => {
        socketRef.current = io.connect(server_url);

        socketRef.current.on("connect", () => {
            socketIdRef.current = socketRef.current.id;
        });
    };

    const connect = () => {
        setAskForUsername(false);
        connectToSocketServer();
    };

    const handleEndCall = () => {
        window.location.href = "/";
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

                    <video ref={localVideoref} autoPlay muted></video>
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

                        {screenAvailable && (
                            <IconButton onClick={() => setScreen(!screen)}>
                                {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
                            </IconButton>
                        )}

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