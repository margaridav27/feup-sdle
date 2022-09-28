# feup-sdle

## Setup rust with zeromq
- Abrir powershell
- `wsl --install`
- `wsl --install -d ubuntu`
- Fechar powershell

- Abrir terminal wsl
- `sudo curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- `sudo apt update`
- `source "$HOME/.cargo/env"`
- `sudo apt install libzmq3-dev`
- `cargo --version`
- `sudo apt install build-essential`

- Ser feliz

## Test run

- `cargo new "<nome para a pasta do projeto>"`
- meter de dependencia `zmq = "0.9"`
- `cd zero_mq`
- `cargo run --bin client` or `cargo run --bin server`