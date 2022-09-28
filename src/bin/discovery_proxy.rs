
fn main() {
    let context = zmq::Context::new();
    let frontend = context.socket(zmq::XPUB).unwrap();
    let backend = context.socket(zmq::XSUB).unwrap();

    frontend
        .bind("tcp://*:5561")
        .expect("failed binding frontend");

    backend
        .connect("tcp://localhost:5562")
        .expect("failed binding backend");

    zmq::proxy(&frontend, &backend).expect("failed proxying");

}