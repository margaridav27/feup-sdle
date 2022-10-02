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
- **Shared** ?, can have more than one active consumer. 
  - Subscription identification (different from topic identification), is of the type `Name [+ Client id]`.

Subscribers:

- Must have an id

### Questions

- Are the subscriptions shared?
- Once a unsubscribe() is called the topic dies? Meaning unshared.
- Do we neeed to create the publishers/subscriber or only the service provider?
- successful put() will deliver to all subscribers ? or only one and then delete the message?

