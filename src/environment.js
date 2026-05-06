let IS_PROD = true;

const server = IS_PROD
  ? "https://video-conferencing-app-1-uqdm.onrender.com"
  : "http://localhost:8000";

export default server;