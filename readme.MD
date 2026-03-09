# 🌐 TCP/IP: O Jogo do Protocolo

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)

Um simulador interativo e educacional construído em **Vanilla JS** para visualizar o tráfego de dados através das camadas do modelo TCP/IP.

🎮 **[Jogue a versão Live aqui!](https://tcp-ip-simulator.vercel.app/)**

---

## 💡 A Ideia Principal

Este projeto nasceu de uma dor real durante meus estudos focados em Infraestrutura e Cibersegurança: **a teoria de redes é muito abstrata.** Ler sobre *3-Way Handshake*, *Packet Loss* ou a diferença entre a confiabilidade do TCP e a velocidade do UDP em livros não traz o mesmo impacto de ver os pacotes se perdendo no caminho.

O objetivo deste simulador é **transformar o invisível em visível**. O usuário digita uma mensagem e acompanha, passo a passo, como ela é encapsulada, segmentada, roteada pela internet e reconstruída no destino final.

![Demonstração do Jogo](caminho/para/o/seu/gif-animado.gif)

---

## 🚀 Como funciona (As Camadas)

A jornada da sua mensagem é dividida em 5 etapas interativas:

1. **Camada de Aplicação (Origem):** O usuário define o protocolo de aplicação (HTTP, DNS, FTP, etc.) e o *Payload* (a mensagem).
2. **Camada de Transporte (Segmentação):** Escolha crítica entre **TCP** e **UDP**. *Aviso: Escolher o protocolo errado para a aplicação errada gera alertas de segurança.*
3. **Camada de Rede (IP):** Validação e carimbo dos endereços IPv4 de origem e destino nos pacotes.
4. **A Internet (Roteamento & Física):** O coração do simulador. 
   - Se for TCP, ocorre a simulação visual do **3-Way Handshake** (SYN, SYN-ACK, ACK).
   - Simulação de latência (ms) e **Packet Loss** (perda de pacotes) baseada em física rudimentar e probabilidade matemática.
   - Retransmissão automática de pacotes perdidos no TCP vs. perda definitiva no UDP.
5. **Destino (Reconstrução):** O *buffer* de chegada. O TCP reordena os pacotes fora de ordem; o UDP entrega o que conseguiu salvar, exibindo as lacunas na mensagem. Um relatório de telemetria é gerado no final.

![Relatório Final e Packet Loss](caminho/para/sua/imagem-relatorio.png)

---

## 🛠️ Decisões Técnicas e Abstrações Didáticas

Atualmente como QA, background em desenvolvimento e visando um futuro na área de cibersegurança, fiz questão de implementar detalhes técnicos importantes, equilibrando o "realismo de máquina" com a "experiência do usuário (UX)":

* **Dual Coding (Texto vs Bytes):** Para facilitar a leitura, o simulador quebra a mensagem por palavras (abstração didática), mas exibe simultaneamente a conversão real em **Bytes Hexadecimais** em cada pacote, mostrando como a máquina realmente enxerga os dados.
* **Validação Rigorosa (QA):** O input de IP possui validação via Regex (Expressões Regulares) para aceitar apenas formatos IPv4 válidos. Os limites de input previnem gargalos de renderização na simulação gráfica.

* **Zero Dependencies:** O projeto foi construído **100% em Vanilla JavaScript**, sem frameworks (React, Vue, etc.) ou bibliotecas externas. A física dos pacotes, o estado global e as manipulações de DOM são nativas. Passível de migração para react.js.

---

## 💻 Como rodar o projeto localmente

Como o projeto não possui dependências complexas ou necessidade de *build*, rodar é extremamente simples:

1. Clone este repositório:
   ```bash
   git clone [github.com/GuilhermeGalante/tcp-ip-simulator](https://github.com/GuilhermeGalante/tcp-ip-simulator)