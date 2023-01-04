## Commands

- broker

- put <topic> <msg>

- get <id> <topic>
- sub <id> <topic>
- unsub <id> <topic>

`cargo run -- broker`
`cargo run -- get -t "boas" -i "123"`
`cargo run -- put -t "boas" -m "oaoaoao"`
`cargo run -- sub -t "boas" -i "123"`

### Notes

Implement a **Publish-Subscribe Service**.

Operations:

- On messages (arbitrary byte sequences)
  - `put()` publish a message to a topic
  - `get()` to consume a message from a topic
- On topics (arbitrary string)
  - `subscribe()` subscribe a topic (creates new topic if not exists)
  - `unsubscribe()` unsubscribe a topic

Subscriptions characterization:

- **Durable**, once created it exists until explictly deleted.
- **Persistent delivery**, ensures *exactly-once* semantics even in the crash of a JMS server.
  - Requires the JMS server to store the message in non-volatile storage
- **Shared** can have more than one active consumer. 
  - Subscription identification (different from topic identification), is of the type `Name [+ Client id]`.

Subscribers:

- Must have an id


## TODO

CLIENT TEAM

SERVER TEAM

BROKER TEAM 🤓
- read file upon start up
- TEST TEST TEST TEST TEST TEST TEST TEST TEST TEST
- WRITE REPORT