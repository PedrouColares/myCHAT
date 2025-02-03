const login = document.querySelector('.login');
const loginForm = document.querySelector('.login-form');
const loginInput = document.querySelector('.login-input');
const chat = document.querySelector('.chat');
const chatForm = document.querySelector('.chat-actions');
const chatInput = document.querySelector('.chat-input');
const chatMessages = document.querySelector('.messages');
const username = document.querySelector('.username');
const emojiButton = document.querySelector('.emoji-button');
const emojiPicker = document.querySelector('.emoji-picker');
const imageUpload = document.getElementById('image-upload');
const recordButton = document.querySelector('.record-button');
const sendButton = document.querySelector('.send-button');
const container = document.getElementById('container');

let ws;
let mediaRecorder;
let audioChunks = [];

const validateUsername = (name) => {
    return /^[a-zA-ZÀ-ÿ]+$/.test(name);
};

const createMsgSelf = (content) => {
    const div = document.createElement('div');
    div.classList.add('msg-self');
    div.innerHTML = content;
    return div;
};

const createMsgOther = (content, sender) => {
    const div = document.createElement('div');
    const span = document.createElement('span');

    div.classList.add('msg-other');
    span.classList.add('msg-sender');

    span.textContent = sender;
    div.appendChild(span);
    div.innerHTML += content;

    return div;
};

const scrollToBottom = () => {
    chatMessages.scroll({
        top: chatMessages.scrollHeight,
        behavior: 'smooth'
    });
};

const handleLogin = (event) => {
    event.preventDefault();

    if (!validateUsername(loginInput.value)) {
        loginInput.style.borderColor = 'red'
        return;
    }

    username.textContent = loginInput.value;
    container.style.display = 'none';
    chat.style.display = 'block';

    ws = new WebSocket("wss://mychat-zmfo.onrender.com");
    ws.onmessage = processMessage;

    const msg = {
        userId: username.textContent,
        userName: username.textContent,
        content: `<fieldset><legend>`
    };

    ws.onopen = () => ws.send(JSON.stringify(msg));

};

const processMessage = ({ data }) => {
    const { userId, userName, content } = JSON.parse(data);

    if (!content.match(/<fieldset><legend>/)) {
        const message = userId === loginInput.value ? createMsgSelf(content) : createMsgOther(content, userName);
        chatMessages.appendChild(message);
    }
    else {
        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');


        legend.innerHTML = userName + ' entrou no Chat';
        fieldset.appendChild(legend);

        chatMessages.appendChild(fieldset);
    }

    scrollToBottom();
};

const sendMessage = (event) => {
    event.preventDefault();

    const messageContent = chatInput.value.trim();
    if (messageContent === '') return;

    const msg = {
        userId: loginInput.value,
        userName: loginInput.value,
        content: messageContent
    };

    ws.send(JSON.stringify(msg));
    chatInput.value = '';
};

emojiButton.addEventListener('click', () => {
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
});

document.querySelectorAll('.emoji').forEach(emoji => {
    emoji.addEventListener('click', () => {
        chatInput.value += emoji.textContent;
        emojiPicker.style.display = 'none';
    });
});

imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const msg = {
                userId: loginInput.value,
                userName: loginInput.value,
                content: `<img src="${e.target.result}" class="message-image" alt="Imagem enviada">`
            };
            ws.send(JSON.stringify(msg));
        };
        reader.readAsDataURL(file);
    }
});

recordButton.addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaRecorder = new MediaRecorder(stream);
                mediaRecorder.start();
                audioChunks = [];

                mediaRecorder.addEventListener('dataavailable', event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.addEventListener('stop', () => {
                    const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const msg = {
                            userId: loginInput.value,
                            userName: loginInput.value,
                            content: `<audio controls class="message-audio" src="${e.target.result}"></audio>`
                        };
                        ws.send(JSON.stringify(msg));
                    };
                    reader.readAsDataURL(audioBlob);
                    stream.getTracks().forEach(track => track.stop());
                });

                recordButton.classList.add('recording');
                recordButton.querySelector('i').classList.remove('fa-microphone');
                recordButton.querySelector('i').classList.add('fa-stop');
            });
    } else {
        mediaRecorder.stop();
        recordButton.classList.remove('recording');
        recordButton.querySelector('i').classList.remove('fa-stop');
        recordButton.querySelector('i').classList.add('fa-microphone');
    }
});

document.addEventListener('click', (event) => {
    if (!event.target.closest('.emoji-picker') && !event.target.closest('.emoji-button')) {
        emojiPicker.style.display = 'none';
    }
});

loginForm.addEventListener('submit', handleLogin);
chatForm.addEventListener('submit', sendMessage);