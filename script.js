
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function stringToHex(str) {
    return str.split('')
              .map(char => char.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase())
              .join(' ');
}

const state = {
    level: 1,
    message: '',
    protocol: 'HTTP/HTTPS',
    transportProto: 'TCP',
    words: [],
    segments: [],
    arrivedPackets: [],
    srcIp: '192.168.1.10',
    destIp: '203.0.113.50',
    latency: 0,
    packetLoss: 0,
    stats: { lost: 0, retransmitted: 0 }
};

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

const SoundFX = {
    playTick: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, audioCtx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    },
    playThump: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    },
    playExplosion: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const bufferSize = audioCtx.sampleRate * 0.4;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioCtx.currentTime);
        filter.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        
        noise.start();
    },
    playSuccess: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2);
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
        
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime + 0.3);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
    },
    playHop: () => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
       
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
    }
};

const levelArea = document.getElementById('level-area');
const infoPanel = document.getElementById('info-panel');
const infoTitle = document.getElementById('info-title');
const infoText = document.getElementById('info-text');

const instructions = {
    1: {
        title: "Camada de Aplicação (A Origem)",
        text: "Tudo começa aqui. Protocolos como HTTP ou DNS geram os dados (o Payload) da sua mensagem. Curiosidade: Antes de 1983, a internet usava o protocolo antigo NCP, que não conectava redes diferentes. O TCP/IP nasceu para resolver isso e criar a internet moderna!\n\n👉 AÇÃO: Escolha um Protocolo de Aplicação, digite sua mensagem, e selecione o Protocolo de Transporte correto (TCP ou UDP)."
    },
    2: {
        title: "Camada de Transporte (Segmentação e Portas)",
        text: "A mensagem é muito grande! Aqui ocorre a 'Segmentação': o despachante (TCP) quebra os dados e os numera para garantir a ordem, ou o entregador rápido (UDP) apenas empacota sem controle. Também definimos a Porta Lógica (ex: 80, 443) de destino.\n\n👉 AÇÃO: Se escolheu TCP, clique nos segmentos para numerá-los. Se escolheu UDP, os pacotes vão sem controle de sequência (apenas avance).\n\nNota didática: Na vida real, o TCP divide os dados por limite de Bytes (MTU da rede), mas aqui usaremos as palavras da sua frase para facilitar a visualização."
    },
    3: {
        title: "Camada de Rede (Roteamento IP)",
        text: "Os segmentos agora viram 'Pacotes'. O IP atua como o sistema de correios: ele não liga para o que tem dentro da caixa, sua única função é colar o Endereço IP de Origem e de Destino para que os roteadores saibam o caminho.\n\n👉 AÇÃO: Confirme ou preencha os IPs de envio e recebimento e aperte o botão para carimbar."
    },
    4: {
        title: "A Internet (A Viagem Caótica)",
        text: "Lançados na teia! Os roteadores decidem o melhor caminho a cada milissegundo.\n\n⚡ Se for TCP: Antes de enviar, ele faz o '3-Way Handshake' (SYN, SYN-ACK, ACK) — um aperto de mãos para garantir que o destino está online. Se perder pacotes na viagem, ele retransmite.\n\n⚡ Se for UDP: Ele ignora o aperto de mãos e dispara tudo cegamente. Se perder na rede, já era.\n\n👉 AÇÃO: Observe o tráfego e torça para chegarem!"
    },
    5: {
        title: "Destino (O Buffer de Reconstrução)",
        text: "Os pacotes chegaram ao destino e caíram no Buffer. O TCP usa os números de sequência para reordenar as peças do quebra-cabeças com perfeição. O UDP joga as peças na mesa na exata ordem de chegada, com os buracos dos pacotes perdidos.\n\n👉 AÇÃO: Clique no botão abaixo para processar o buffer e ver como a mensagem original foi entregue."
    }
};

function initGame() {
    state.stats = { lost: 0, retransmitted: 0 };
    updateProgressUI();
    loadLevel(1);
}

function updateProgressUI() {
    document.querySelectorAll('.step').forEach(step => {
        const stepNum = parseInt(step.getAttribute('data-step'));
        step.classList.remove('active', 'completed');
        if (stepNum < state.level) step.classList.add('completed');
        if (stepNum === state.level) step.classList.add('active');
    });

    infoTitle.innerText = instructions[state.level].title;
    infoText.innerText = instructions[state.level].text;
    infoPanel.classList.remove('hidden');
}

function loadLevel(level) {
    state.level = level;
    levelArea.innerHTML = '';
    updateProgressUI();

    switch(level) {
        case 1: renderLevel1(); break;
        case 2: renderLevel2(); break;
        case 3: renderLevel3(); break;
        case 4: renderLevel4(); break;
        case 5: renderLevel5(); break;
    }
}

function renderLevel1() {
    const div = document.createElement('div');
    div.className = 'app-level';
    div.innerHTML = `
        <h2>Preparação da Mensagem</h2>
        
        <div style="margin-bottom: 20px;">
            <label style="display:block; margin-bottom:8px; color:var(--accent);">1. Protocolo de Aplicação:</label>
            <select id="appProtocolSelect" class="custom-select">
                <option value="HTTP/HTTPS" ${state.protocol === 'HTTP/HTTPS' ? 'selected' : ''}>HTTP/HTTPS (Navegação Web - Portas 80/443)</option>
                <option value="DNS" ${state.protocol === 'DNS' ? 'selected' : ''}>DNS (Resolução de Nomes - Porta 53)</option>
                <option value="SMTP" ${state.protocol === 'SMTP' ? 'selected' : ''}>SMTP (Envio de E-mail - Porta 25)</option>
                <option value="POP3/IMAP" ${state.protocol === 'POP3/IMAP' ? 'selected' : ''}>POP3/IMAP (Recebimento de E-mail - Portas 110/143)</option>
                <option value="FTP" ${state.protocol === 'FTP' ? 'selected' : ''}>FTP (Transferência de Arquivos - Portas 20/21)</option>
                <option value="SSH/Telnet" ${state.protocol === 'SSH/Telnet' ? 'selected' : ''}>SSH/Telnet (Acesso Remoto - Porta 22/23)</option>
                <option value="SNMP" ${state.protocol === 'SNMP' ? 'selected' : ''}>SNMP (Monitoramento de Rede - Porta 161)</option>
            </select>
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display:block; margin-bottom:8px; color:var(--accent);">2. Escreva sua Mensagem:</label>
            <input type="text" id="userInput" placeholder="Ex: Olá mundo da internet" autocomplete="off" value="${escapeHTML(state.message)}">
        </div>

        <div style="margin-bottom: 20px;">
            <label style="display:block; margin-bottom:8px; color:var(--accent);">3. Protocolo de Transporte:</label>
            <div class="protocol-selector" id="transport-selector">
                <button class="protocol-btn transport-btn ${state.transportProto === 'TCP' ? 'selected' : ''}" data-proto="TCP">TCP (Confiável)</button>
                <button class="protocol-btn transport-btn ${state.transportProto === 'UDP' ? 'selected' : ''}" data-proto="UDP">UDP (Rápido)</button>
            </div>
        </div>
        
        <div id="validationError" class="error-banner" style="display: none;"></div>
        
        <button id="nextBtn1" disabled>Formatar e Enviar (Para Transporte)</button>
    `;
    levelArea.appendChild(div);

    const input = document.getElementById('userInput');
    const nextBtn = document.getElementById('nextBtn1');
    const appSelect = document.getElementById('appProtocolSelect');
    const transProtos = document.querySelectorAll('.transport-btn');
    const errorBanner = document.getElementById('validationError');

   
    state.protocol = appSelect.value;

    appSelect.addEventListener('change', (e) => {
        state.protocol = e.target.value;
        errorBanner.style.display = 'none';
    });

    input.addEventListener('input', (e) => {
        state.message = e.target.value;
        const words = state.message.trim().split(/\s+/).filter(w => w.length > 0);
        if (words.length > 10) {
            nextBtn.disabled = true;
            errorBanner.innerHTML = "⚠️ Carga muito alta: Para não sobrecarregar a simulação visual, use no máximo 10 palavras.";
            errorBanner.style.display = 'flex';
        } else {
            nextBtn.disabled = state.message.trim().length === 0;
            errorBanner.style.display = 'none';
        }
    });

    input.addEventListener('keydown', (e) => {
       
        if (e.key.length === 1 || e.key === 'Backspace') {
            SoundFX.playTick();
        }
        
        if (e.key === 'Enter' && !nextBtn.disabled) {
            nextBtn.click();
        }
    });

    if(state.message.length > 0) nextBtn.disabled = false;

    transProtos.forEach(p => p.addEventListener('click', (e) => {
        transProtos.forEach(btn => btn.classList.remove('selected'));
        e.target.classList.add('selected');
        state.transportProto = e.target.getAttribute('data-proto');
        errorBanner.style.display = 'none';
    }));

   
    const mensagensErro = {
        'HTTP/HTTPS': 'A web clássica requer a garantia do TCP. (Nota avançada: O moderno protocolo HTTP/3 contorna isso usando UDP através do QUIC para maior velocidade). Mude para <b>TCP</b>.',
        
        'SMTP': 'O SMTP envia e-mails. Você não quer que seu e-mail chegue faltando palavras! O UDP não garante a entrega. Mude para <b>TCP</b>.',
        
        'POP3/IMAP': 'Para baixar seus e-mails sem corromper os anexos, é necessária a confiabilidade total da rede. Mude para <b>TCP</b>.',
        
        'FTP': 'Arquivos não toleram perda de dados. (Curiosidade: Existe o TFTP, que usa UDP para arquivos pequenos em redes locais, mas o FTP clássico exige garantia). Mude para <b>TCP</b>.',
        
        'SSH/Telnet': 'No terminal remoto, cada comando deve chegar na ordem exata. (Nota avançada: Túneis modernos de acesso remoto, como o WireGuard, preferem UDP, mas o SSH é estritamente TCP). Mude para <b>TCP</b>.',
        
        'SNMP': 'O SNMP envia alertas curtos de monitoramento. (Curiosidade: A documentação permite SNMP via TCP, mas na prática 99% usa UDP para não gerar tráfego excessivo em redes que estão falhando). Escolha <b>UDP</b>.'
    };

    function validateProtocolCombination() {
        const app = state.protocol;
        const trans = state.transportProto;
        
        const requiresTCP = ['HTTP/HTTPS', 'SMTP', 'POP3/IMAP', 'FTP', 'SSH/Telnet'];
        const requiresUDP = ['SNMP'];
        
        if (requiresTCP.includes(app) && trans === 'UDP') {
            return `
                <div style="font-weight: bold; min-width: 150px; color: #fca5a5;">⚠️ Acesso Negado:</div>
                <div style="flex-grow: 1;">${mensagensErro[app]}</div>
            `;
        }
        
        if (requiresUDP.includes(app) && trans === 'TCP') {
            return `
                <div style="font-weight: bold; min-width: 150px; color: #fca5a5;">⚠️ Aviso:</div>
                <div style="flex-grow: 1;">${mensagensErro[app]}</div>
            `;
        }
        
        return null;
    }

    nextBtn.addEventListener('click', () => {
        const errorMsg = validateProtocolCombination();
        if (errorMsg) {
            errorBanner.innerHTML = errorMsg;
            errorBanner.style.display = 'flex';
           
            errorBanner.style.animation = 'none';
            errorBanner.offsetHeight; 
            errorBanner.style.animation = null; 
            return;
        }

       
        state.words = state.message.trim().split(/\s+/).filter(w => w.length > 0);
        state.segments = state.words.map((w, i) => ({
            id: i,
            word: w,
            seq: state.transportProto === 'UDP' ? null : null,
            srcIp: null,
            destIp: null,
            lost: false
        }));
        loadLevel(2);
    });
}

function renderLevel2() {
    const isUDP = state.transportProto === 'UDP';
    const div = document.createElement('div');
    div.className = 'tcp-level';
    
    let segmentsHtml = state.segments.map((seg, i) => `
        <div class="segment" id="seg-${i}" tabindex="${isUDP ? '-1' : '0'}" role="button" aria-label="Segmento com o dado: ${escapeHTML(seg.word)}">
            <div class="header-tcp" id="seq-text-${i}">Seq: ${isUDP ? '⛔ (Sem Seq)' : '?'}</div>
            <div class="data">[${escapeHTML(state.protocol)}] ${escapeHTML(seg.word)}</div>
            <div style="font-size: 0.7rem; color: var(--accent); margin-top: 5px; text-align: center; word-break: break-all;">Hex: ${stringToHex(seg.word)}</div>
        </div>
    `).join('');

    div.innerHTML = `
        <h2>Adicione Números de Sequência</h2>
        <p>${isUDP ? 'O UDP não usa números de sequência! Avance livremente.' : 'Clique (ou use Tab e Enter) da esquerda para a direita em cada pedaço da mensagem para "carimbar" o segmento pelo TCP.'}</p>
        <div class="segments-container">
            ${segmentsHtml}
        </div>
        <div style="margin-top: 20px;">
            ${!isUDP ? '<button id="resetSeqBtn" class="action-btn" style="background: var(--secondary); margin-right: 10px;">Resetar Sequência</button>' : ''}
            <button id="nextBtn2" class="action-btn" style="display:${isUDP ? 'inline-block' : 'none'};">Enviar para IP (Camada de Rede)</button>
        </div>
    `;
    levelArea.appendChild(div);

    let currentSeq = 1;

    function stampSegment(segElement, seg, index) {
        if (isUDP) return;
        if (!segElement.classList.contains('stamped')) {
            SoundFX.playThump();
            segElement.classList.add('stamped');
            document.getElementById(`seq-text-${index}`).innerHTML = `Seq: ${currentSeq}`;
            seg.seq = currentSeq;
            currentSeq++;

            if (currentSeq > state.segments.length) {
                const nextBtn2 = document.getElementById('nextBtn2');
                nextBtn2.style.display = 'inline-block';
                nextBtn2.focus();
            }
        }
    }

    if (!isUDP) {
        state.segments.forEach((seg, i) => {
            const segElement = document.getElementById(`seg-${i}`);
            
            segElement.addEventListener('click', () => stampSegment(segElement, seg, i));
            
            segElement.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    stampSegment(segElement, seg, i);
                }
            });
        });

        document.getElementById('resetSeqBtn').addEventListener('click', () => {
            currentSeq = 1;
            state.segments.forEach((seg, i) => {
                seg.seq = null;
                const segElement = document.getElementById(`seg-${i}`);
                segElement.classList.remove('stamped');
                document.getElementById(`seq-text-${i}`).innerHTML = `Seq: ?`;
            });
            document.getElementById('nextBtn2').style.display = 'none';
            document.getElementById('seg-0').focus();
        });
    }

    document.getElementById('nextBtn2').addEventListener('click', () => {
        loadLevel(3);
    });
}

function renderLevel3() {
    const div = document.createElement('div');
    div.className = 'ip-level';
    
    let segmentsHtml = state.segments.map((seg, i) => `
        <div class="segment">
            <div class="header-ip" id="ip-text-${i}">IPs: ?</div>
            <div class="header-tcp">Seq: ${seg.seq !== null ? seg.seq : '⛔'}</div>
            <div class="data">[${escapeHTML(state.protocol)}] ${escapeHTML(seg.word)}</div>
            <div style="font-size: 0.7rem; color: var(--accent); margin-top: 5px; text-align: center; word-break: break-all;">Hex: ${stringToHex(seg.word)}</div>
        </div>
    `).join('');

    div.innerHTML = `
        <h2>Empacotamento IP</h2>
        <div class="ip-inputs">
            <div>
                <label>Seu IP (Origem):</label><br>
                <input type="text" id="srcIpInput" value="${state.srcIp}">
            </div>
            <div>
                <label>Destino IP:</label><br>
                <input type="text" id="destIpInput" value="${state.destIp}">
            </div>
            <button id="applyIpBtn">Carimbar IPs</button>
        </div>
        <div class="segments-container">
            ${segmentsHtml}
        </div>
        <button id="nextBtn3" class="action-btn" style="display:none;">Lançar na Internet!</button>
    `;
    levelArea.appendChild(div);

    const applyIpBtn = document.getElementById('applyIpBtn');
    applyIpBtn.addEventListener('click', () => {
        SoundFX.playThump();
        const srcIpVal = document.getElementById('srcIpInput').value || '192.168.1.1';
        const destIpVal = document.getElementById('destIpInput').value || '8.8.8.8';
        
        const ipv4Regex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        if (!ipv4Regex.test(srcIpVal) || !ipv4Regex.test(destIpVal)) {
            let errBan = document.getElementById('ipValidationErr');
            if(!errBan) {
                errBan = document.createElement('div');
                errBan.id = 'ipValidationErr';
                errBan.className = 'error-banner';
                errBan.style.marginTop = '15px';
                errBan.style.width = '100%';
                document.querySelector('.ip-inputs').appendChild(errBan);
            }
            errBan.innerHTML = "⚠️ Formato de IPv4 inválido.";
            errBan.style.display = 'flex';
            errBan.style.animation = 'none';
            errBan.offsetHeight; 
            errBan.style.animation = null;
            document.getElementById('nextBtn3').style.display = 'none';
            return;
        }
        
        const errBan = document.getElementById('ipValidationErr');
        if(errBan) errBan.style.display = 'none';

        state.srcIp = srcIpVal;
        state.destIp = destIpVal;
        
        state.segments.forEach((seg, i) => {
            seg.srcIp = state.srcIp;
            seg.destIp = state.destIp;
            document.getElementById(`ip-text-${i}`).innerText = `De: ${state.srcIp} Para: ${state.destIp}`;
            document.getElementById(`ip-text-${i}`).style.color = 'var(--success)';
        });

        const nextBtn3 = document.getElementById('nextBtn3');
        nextBtn3.style.display = 'block';
        nextBtn3.focus();
    });

    const triggerApplyOnEnter = (e) => {
        if (e.key === 'Enter') {
            applyIpBtn.click();
        }
    };
    document.getElementById('srcIpInput').addEventListener('keydown', triggerApplyOnEnter);
    document.getElementById('destIpInput').addEventListener('keydown', triggerApplyOnEnter);

    document.getElementById('nextBtn3').addEventListener('click', () => {
        loadLevel(4);
    });
}

function renderLevel4() {
    state.latency = Math.floor(Math.random() * 131) + 20;
    state.packetLoss = Math.floor(Math.random() * 21) + 10;
    const isTCP = state.transportProto === 'TCP';

    levelArea.innerHTML = `
        <div class="internet-level" id="internetNet">
            <div class="network-stats">🌐 Latência: ${state.latency} ms | 📉 Packet Loss: ${state.packetLoss}%</div>
            <div id="handshake-status" class="handshake-status"></div>
        </div>
    `;
    const internetNet = document.getElementById('internetNet');
    const handshakeStatus = document.getElementById('handshake-status');
    
   
    const nodes = [];
    const width = levelArea.clientWidth;
    const height = levelArea.clientHeight || 400;
    
    function createNode(x, y, label, type) {
        const span = document.createElement('div');
        span.className = 'router-node';
        if(type) span.classList.add(type === 'success' ? 'active' : '');
        span.style.left = (x - 20) + 'px';
        span.style.top = (y - 20) + 'px';
        span.innerText = label;
        const node = {x, y, el: span, neighbors: []};
        nodes.push(node);
        internetNet.appendChild(span);
        return node;
    }

   
    createNode(50, height/2, 'A', 'success');
   
    createNode(width - 50, height/2, 'B', 'success');

   
    const col1X = width * 0.33;
    const col2X = width * 0.66;
    createNode(col1X, height * 0.25, 'R1');
    createNode(col1X, height * 0.5, 'R2'); 
    createNode(col1X, height * 0.75, 'R3');
    createNode(col2X, height * 0.25, 'R4');
    createNode(col2X, height * 0.5, 'R5'); 
    createNode(col2X, height * 0.75, 'R6');

   
    const edges = [
        [0, 2], [0, 3], [0, 4],
        [2, 5], [2, 6], [3, 5], [3, 6], [3, 7], [4, 6], [4, 7],
        [5, 1], [6, 1], [7, 1]
    ];

    edges.forEach(([u, v]) => {
        const n1 = nodes[u];
        const n2 = nodes[v];
        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const length = Math.sqrt(dx*dx + dy*dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        const line = document.createElement('div');
        line.className = 'graph-edge';
        line.style.width = length + 'px';
        line.style.left = n1.x + 'px';
        line.style.top = n1.y + 'px';
        line.style.transform = `rotate(${angle}deg)`;
        internetNet.appendChild(line);

        n1.neighbors.push(n2);
        n2.neighbors.push(n1);
    });

    state.arrivedPackets = [];
    let expectedTotalPackets = state.segments.length;
    let handledPacketsCount = 0;
    const transTime = Math.max(0.8, state.latency / 120);

   
    function performHandshake(callback) {
        handshakeStatus.innerText = "TCP: Iniciando 3-Way Handshake...";
        
        function showBubble(node, text, isDest, duration) {
            const bubble = document.createElement('div');
            bubble.className = `cyber-bubble ${isDest ? 'dest' : ''}`;
            bubble.innerHTML = text.replace(/\[SYN\]|\[SYN-ACK\]|\[ACK\]/, match => `<strong style="color:${isDest ? '#ec4899' : '#14b8a6'}">${match}</strong>`);
            
            if (window.innerWidth >= 768) {
                const bubbleWidthEstimate = 200; 
                let posX = node.x - 20; 

                if (isDest) {
                    posX = node.x + 60 - bubbleWidthEstimate;
                }
                
                bubble.style.left = posX + 'px';
                bubble.style.top = (node.y - 70) + 'px'; 
            }
            
            internetNet.appendChild(bubble);
            setTimeout(() => bubble.remove(), duration);
        }

        function sendControlPacket(label, startN, endN, color, nextStepCallback) {
            const packetEl = document.createElement('div');
            packetEl.className = 'flying-packet';
            packetEl.innerText = label;
            packetEl.style.background = color;
            packetEl.style.boxShadow = `0 0 10px ${color}`;
            packetEl.style.transition = `all ${transTime}s linear`;
            packetEl.style.zIndex = "20";
            internetNet.appendChild(packetEl);

            const path = [startN];
            let curr = startN;
            while (curr !== endN) {
                const nexts = curr.neighbors;
                let validNexts = nexts.filter(n => (startN === nodes[0] ? n.x > curr.x : n.x < curr.x) || n === endN);
                if(validNexts.length === 0) validNexts = nexts;
                curr = validNexts[Math.floor(Math.random() * validNexts.length)];
                path.push(curr);
            }

            let currentHop = 0;
            function moveNextHop() {
                if (currentHop >= path.length) {
                    packetEl.remove();
                    if(nextStepCallback) setTimeout(nextStepCallback, 300);
                    return;
                }
                const targetNode = path[currentHop];
                packetEl.style.left = (targetNode.x - 10) + 'px';
                packetEl.style.top = (targetNode.y - 10) + 'px';
                targetNode.el.classList.add('active');
                if (currentHop > 0) SoundFX.playHop();
                setTimeout(() => { if(targetNode !== startN && targetNode !== endN) targetNode.el.classList.remove('active'); }, 300);
                currentHop++;
                setTimeout(moveNextHop, transTime * 1000 + 100);
            }
            packetEl.style.left = (startN.x - 10) + 'px';
            packetEl.style.top = (startN.y - 10) + 'px';
            SoundFX.playTick();
            setTimeout(moveNextHop, 50);
        }

        setTimeout(() => {
            handshakeStatus.innerText = "Handshake (1/3): Enviando SYN...";
            showBubble(nodes[0], "Servidor, tá online? [SYN]", false, 2500);
            
            sendControlPacket('SYN', nodes[0], nodes[1], '#ffaa00', () => {
                
                handshakeStatus.innerText = "Handshake (2/3): Recebendo SYN-ACK...";
                showBubble(nodes[1], "Tô sim! Pronto pra receber! [SYN-ACK]", true, 2500);
                
                sendControlPacket('S-A', nodes[1], nodes[0], '#ffaa00', () => {
                    
                    handshakeStatus.innerText = "Handshake (3/3): Enviando ACK...";
                    showBubble(nodes[0], "Beleza, mandando os dados! [ACK]", false, 2000);
                    
                    sendControlPacket('ACK', nodes[0], nodes[1], '#00ff00', () => {
                        
                        handshakeStatus.style.color = '#00ff00';
                        handshakeStatus.innerText = "TCP: Conexão Estabelecida!";
                        SoundFX.playSuccess();
                        setTimeout(() => {
                            handshakeStatus.innerText = "";
                            callback();
                        }, 1000);
                    });
                });
            });
        }, 800);
    }

   
    function startDataTransmission() {
        if (!isTCP) handshakeStatus.innerText = "UDP: Sem Handshake. Disparando dados!";
        
        state.segments.forEach((seg, i) => {
            setTimeout(() => {
                const willLoose = Math.random() < (state.packetLoss / 100);
                if (willLoose) seg.lost = true;
                schedulePacket(seg, willLoose);
            }, i * 1500);
        });
    }

   
    if (isTCP) {
        performHandshake(startDataTransmission);
    } else {
        startDataTransmission();
    }

    function schedulePacket(seg, willLoose) {
        const packetEl = document.createElement('div');
        packetEl.className = 'flying-packet';
        packetEl.innerText = seg.seq !== null ? seg.seq : `P${seg.id}`;
        packetEl.style.transition = `all ${transTime}s linear`;
        internetNet.appendChild(packetEl);

        animatePacket(packetEl, seg, willLoose, transTime);
    }

    function animatePacket(packetEl, seg, willLoose, transTime) {
        const startNode = nodes[0];
        const endNode = nodes[1];
        
        const path = [startNode];
        let curr = startNode;
        while (curr !== endNode) {
            const nexts = curr.neighbors;
            let validNexts = nexts.filter(n => n.x > curr.x || n === endNode);
            if(validNexts.length === 0) break;
            curr = validNexts[Math.floor(Math.random() * validNexts.length)];
            path.push(curr);
        }

        const dropIndex = willLoose ? Math.floor(Math.random() * (path.length - 1)) + 1 : -1;
        let currentHop = 0;

        function moveNextHop() {
            if (willLoose && currentHop === dropIndex) {
                 packetEl.innerText = '💥';
                 packetEl.classList.add('packet-explosion');
                 SoundFX.playExplosion();
                 state.stats.lost++;
                 
                 setTimeout(() => {
                     packetEl.remove();
                     if (!isTCP) {
                         handledPacketsCount++;
                         checkAllArrived();
                     } else {
                         state.stats.retransmitted++;
                         const retryText = document.createElement('div');
                         retryText.className = 'retransmitting-text';
                         retryText.innerText = '🔁 Retransmitindo...';
                         retryText.style.left = (startNode.x - 20) + 'px';
                         retryText.style.top = (startNode.y - 40) + 'px';
                         internetNet.appendChild(retryText);
                         
                         setTimeout(() => {
                             retryText.remove();
                             schedulePacket(seg, false);
                         }, 1000);
                     }
                 }, 600);
                 return;
            }

            if (currentHop >= path.length) {
                packetEl.remove();
                state.arrivedPackets.push(seg);
                handledPacketsCount++;
                checkAllArrived();
                return;
            }

            const targetNode = path[currentHop];
            packetEl.style.left = (targetNode.x - 10) + 'px';
            packetEl.style.top = (targetNode.y - 10) + 'px';
            targetNode.el.classList.add('active');
            
            if (targetNode === endNode) SoundFX.playTick(); 
            else if (targetNode !== startNode) SoundFX.playHop(); 

            setTimeout(() => {
                if(targetNode !== startNode && targetNode !== endNode) targetNode.el.classList.remove('active');
            }, 300);

            currentHop++;
            setTimeout(moveNextHop, transTime * 1000 + 200);
        }

        packetEl.style.left = (startNode.x - 10) + 'px';
        packetEl.style.top = (startNode.y - 10) + 'px';
        if (currentHop === 0) SoundFX.playHop(); 
        
        setTimeout(moveNextHop, 50);
    }

    function checkAllArrived() {
        if (handledPacketsCount === expectedTotalPackets) {
            setTimeout(() => { loadLevel(5); }, 1000);
        }
    }
}

function renderLevel5() {
    const isUDP = state.transportProto === 'UDP';
    const div = document.createElement('div');
    div.className = 'dest-level';
    
   
    let arrivedHtml = state.arrivedPackets.map(seg => `
        <div class="segment" id="dest-seg-${seg.id}" style="border-color: var(--secondary);">
            <div class="header-tcp">Seq: ${seg.seq !== null ? seg.seq : '⛔'}</div>
            <div class="data">${escapeHTML(seg.word)}</div>
            <div style="font-size: 0.7rem; color: var(--accent); margin-top: 5px; text-align: center; word-break: break-all;">Hex: ${stringToHex(seg.word)}</div>
        </div>
    `).join('');

    div.innerHTML = `
        <h2>Buffer de Recebimento ${state.transportProto}</h2>
        <p>Os pacotes chegaram! ${isUDP ? 'Como foi via UDP, alguns pacotes podem ter se perdido (Packet Loss) e não há números de sequência para ordenar.' : 'Eles podem estar fora de ordem devido ao roteamento com TCP.'}</p>
        <div class="assembly-area" id="receiverBuffer">
            ${state.arrivedPackets.length > 0 ? arrivedHtml : '<p style="color:var(--secondary)">Ops... Todos os pacotes foram perdidos na rede!</p>'}
        </div>
        <button id="reconstructBtn" class="action-btn">${isUDP ? 'Forçar Leitura da Mensagem Bruta' : 'Mandar o TCP Reordenar!'}</button>
        <div class="final-message-box" id="finalMessageBox"></div>
    `;
    levelArea.appendChild(div);

    document.getElementById('reconstructBtn').addEventListener('click', (e) => {
        e.target.style.display = 'none';
        
        const buffer = document.getElementById('receiverBuffer');
        buffer.innerHTML = '';
        
       
        let parsedPackets;
        
        if (isUDP) {
           
           
            parsedPackets = [...state.arrivedPackets];
        } else {
           
            parsedPackets = [...state.arrivedPackets].sort((a, b) => a.seq - b.seq);
        }

        if (state.arrivedPackets.length === 0) {
            showFinalMessage(parsedPackets, isUDP, div);
            return;
        }

        parsedPackets.forEach((seg, i) => {
            setTimeout(() => {
                const segEl = document.createElement('div');
                segEl.className = 'segment';
                segEl.style.borderColor = isUDP ? 'var(--secondary)' : 'var(--success)';
                segEl.innerHTML = `
                    <div class="header-tcp" style="color: ${isUDP ? 'var(--secondary)' : 'var(--success)'}">Seq: ${seg.seq !== null ? seg.seq : '⛔'}</div>
                    <div class="data">${escapeHTML(seg.word)}</div>
                    <div style="font-size: 0.7rem; color: var(--accent); margin-top: 5px; text-align: center; word-break: break-all;">Hex: ${stringToHex(seg.word)}</div>
                `;
                buffer.appendChild(segEl);

               
                if (i === parsedPackets.length - 1) {
                    setTimeout(() => showFinalMessage(parsedPackets, isUDP, div), 500);
                }
            }, i * 400);
        });
    });
}

function showFinalMessage(parsedPackets, isUDP, containerDiv) {
    const box = document.getElementById('finalMessageBox');
    
    let finalString = "";
    if (isUDP) {
       
        let finalWords = Array(state.segments.length).fill("[PERDIDO]");
        parsedPackets.forEach(p => finalWords[p.id] = p.word);
        finalString = finalWords.join(' ');
    } else {
        finalString = parsedPackets.map(s => s.word).join(' ');
    }
    
   
    box.innerHTML = `[${escapeHTML(state.protocol)}] Mensagem Original:<br><br><b id="typewriterText"></b><span class="typewriter-cursor">|</span>`;
    box.classList.add('visible');
    
    const typewriterText = document.getElementById('typewriterText');
    let charIndex = 0;
    
    function typeWriter() {
        if (charIndex < finalString.length) {
            const char = finalString.charAt(charIndex);
            
           
            if (char === ' ') {
               
                typewriterText.innerHTML += '&nbsp;';
            } else {
               
                typewriterText.textContent += char;
                SoundFX.playTick();
            }
            
            charIndex++;
            setTimeout(typeWriter, 40);
        } else {
           
            SoundFX.playSuccess();
            
            if (isUDP && state.arrivedPackets.length < state.segments.length) {
                 box.innerHTML += `<br><br><span style="font-size:0.8rem; color: var(--secondary)">⚠️ Atenção: ${state.segments.length - state.arrivedPackets.length} pacote(s) se perderam na rede! O UDP não tenta recuperá-los.</span>`;
            }
            
            const reportDiv = document.createElement('div');
            reportDiv.className = 'hacker-report';
            reportDiv.innerHTML = `
                <div style="text-align:center; color: var(--accent); margin-bottom: 15px; font-weight: bold;">📊 Relatório de Transmissão</div>
                <div style="margin-bottom: 5px;">> Protocolo Usado: <span style="color:white">${state.transportProto}</span></div>
                <div style="margin-bottom: 5px;">> Pacotes Enviados: <span style="color:white">${state.segments.length}</span></div>
                <div style="margin-bottom: 5px;">> Pacotes Perdidos no Trajeto: <span style="color:var(--secondary)">${state.stats.lost}</span></div>
                <div style="margin-bottom: 5px;">> Retransmissões: <span style="color:#ffaa00">${state.stats.retransmitted}</span></div>
                <div style="margin-bottom: 5px;">> Latência Média da Rede: <span style="color:white">${state.latency}ms</span></div>
            `;
            containerDiv.appendChild(reportDiv);
            
            const restartBtn = document.createElement('button');
            restartBtn.className = 'action-btn';
            restartBtn.innerText = 'Reiniciar Jogo';
            restartBtn.style.marginTop = '20px';
            restartBtn.onclick = () => {
                state.message = '';
                state.arrivedPackets = [];
                state.words = [];
                state.segments = [];
                initGame();
            };
            containerDiv.appendChild(restartBtn);
        }
    }
    
   
    setTimeout(typeWriter, 300);
}

initGame();