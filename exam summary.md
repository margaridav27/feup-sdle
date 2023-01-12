# Message Oriented Midleware (MOM)

## Message-based Communication

### Message

An atomic bit string

| Layer       | Description                                                      |
| ----------- | ---------------------------------------------------------------- |
| Application | Specific communication services                                  |
| Transport   | Communication between 2+ processes                               |
| Network     | Communication between 2 PCs not directly connected w/ each other |
| Interface   | Communication between 2 PCs directly connected w/ each other     |

| Property           | UDP     | TCP    |
| ------------------ | ------- | ------ |
| Abstraction        | Message | Stream |
| Connection-based   | N       | Y      |
| Reliability        | N       | Y      |
| Ordering           | N       | Y      |
| Flow control       | N       | Y      |
| Congestion control | N       | Y      |

### TCP Reliability

#### Message Loss

- can we assume all data sent through a TCP connection will be delivered to the remote end? **NO!**
- **BUT**, TPC guarantees that the application will be notified if the local end is unable to communicate w/ the remote end
- **TCP cannot guarantee that there is no data loss and does not retransmit data that was lost in other connections**

#### Message Duplication

- **TCP is not able to filter data duplicated by the application, only duplicated TCP segments**
- to address this issue, the application must be able to synchronize with the remote end to learn if there was some data loss in either direction
- simply retransmit messages is not always a feasible solution due to non-idempotent operations

### RPC

- typically implemented on top of the transport layer
- great for req-rep communication patterns
- but is not always the best approach
- require both communication parties to be simultaneously available (which is not always possible)

## Asynchronous Communication - MOM - Basic Patterns

Sender and receiver do not need to synchronize w/ one another

### Point-to-Point

- queue
  - senders put messages on the queue
  - receivers get messages from the queue
- each message is delivered to **at most** one process (single-destination communication)

### Pub-Sub

- topics
  - publishers put messages in a topic
  - subscribers get messages from a topic
  - each topic constitutes its own queue
- each message may be delivered to more than one process (subscribers - multi-destination communication)

### JMS

- to use the JMS, a client must first set up a connection to the provider
- clients send/receive messages to/from destinations in the context of a session
- sessions are created in the context of a connection
- JMS messages have 3 parts: header (to identify and route), properties (optional metadata) and body (actual data)
- messages sent **in the context of a session** to a queue are delivered in the sending order (this guarantee only applies to messages with the same delivery mode - see below)
- does not guarantee interoperability, i.e. a JMS provider being able to communicate with another JMS provider, which may be a limitation in cases where one needs to integrate different JMS providers

|         | Blocking | Non-Blocking | Asynchronous |
| ------- | -------- | ------------ | ------------ |
| send    | Y        | -            | via callback |
| receive | Y        | via timeout  | via callback |

#### JMS Queue

- **point-to-point** pattern
- if multiple clients consume messages from a queue, then a client may not receive all messages

#### JMS Topic

- **pub-sub** pattern
- a subscription may be
  - **durable** - once created, it exists until explicitly deleted / **non-durable** - exists only while there is an active consumer (but the topic continues to exist)
  - **unshared** - can have only one active subscriber at a time / **shared** - can have multiple active subscribers

#### Delivery Modes

##### PERSISTENT

- ensures **once-and-only-once** semantics
- [JMS TOPIC] if subscription is non-durable and client is inactive, message is missed; durable subscriptions provide same guarantees as queues
- implementation is not trivial
- built on top of TCP
  - producer sends a message - must receive confirmation from the JMS server
  - consumer receives a message - must acknowledge the reception before the JMS can discard the message, in order to ensure that the message is delivered to exactly one consumer
  - this way, we handle message loss between a client (producer/consumer) and the JMS server
  - but it still depends on the consumer acknowledgment mode used by the consumer
    - AUTO_ACKNOWLEDGE: JMS session automatically acknowledges upon a successful return from either `receive()` or the reception callback
    - DUPS_OK_ACKNOWLEDGE: JMS session lazily acknowledges the delivery of messages
    - CLIENT_ACKNOWLEDGE: it is up to the client to acknowledge the delivery of messages

##### NON_PERSISTENT

- ensures **at-most-once** semantics
- [JMS TOPIC] if subscription is non-durable and client is inactive, message is missed; durable subscriptions provide same guarantees as queues

### Message Brokers

Convert the format of the messages used by one application to the format used by another application (they are not part of the communication service)

# Replication for Fault Tolerance

## Quorum Consensus

**Quorum** is a set of replicas

Let's assume that exists N replicas of a file

To **read** the file, the client needs to assemble a **read quorum**, i.e. an arbitrary collection of **N<sub>R</sub>** servers

To **write** to the file, the client needs to assemble a **write quorum**, i.e. an arbitrary collection of **N<sub>W</sub>** servers

Since a read operation depends on previous write operations, **N<sub>R</sub>** is subject to the constraint **N<sub>R</sub> + N<sub>W</sub> > N** (read quorum must overlap write quorum) -> prevents read-write conflicts

Since a write operation depends on previous write operations, **N<sub>W</sub>** is subject to the constraint **N<sub>W</sub> + N<sub>W</sub> > N** (write quorums must overlap or, in other words, a write quorum must constitute a majority) -> prevents write-write conflicts

**Let f be the maximum number of replicas that may crash simultaneously, then the minimum number of replicas needed for the system to tolerate replicas' unavailability is f+1**

## XA-based Quorum Consensus Implementation

read more

## Transaction-based Quorum Consensus Replication

read more

# Replication and Consistency Models

## Sequential Consistency

The sequential consistency model guarantees that all threads will see the same sequence of memory operations in the same order. In other words, the model ensures that if two memory operations are performed by different threads, they will appear to have been performed in the order in which they were requested, regardless of the actual order in which they were executed by the hardware

**Sequential consistency is not composable** because it requires that all memory operations be ordered in a single global sequence, which means that the order of memory operations performed by different threads cannot be determined independently. This makes it difficult to compose multiple concurrent operations because their ordering may depend on the ordering of other operations

### Protocol

- **read**: reads from one replica
- **write**: writes to all replicas in same order and does not require a reply
- **snapshot**: reads from one replica

## Linearizability

An execution is linearizable iff it is sequential consistent and if op<sub>1</sub> occurs before op<sub>2</sub>, according to one omniscient observer, then op<sub>1</sub> must appear before op<sub>2</sub>

op<sub>1</sub> occuring before op<sub>2</sub> means that op<sub>1</sub>'s finish time is smaller than op<sub>2</sub>'s start time - if the operations overlap in time, their relative order may be any

### Protocol

- **read**: reads from one replica
- **write**: writes to all replicas in same order and waits for ack from all replicas before returning
- **snapshot**: reads from one replica

Guaranteeing linearizability usually requires more synchronization

# Replication for Fault Tolerance

## Quorums-Consensus Replicated ADT

A quorum for an operation is any set of replicas that includes an initial and a final quorums, which can be represented by a pair, (m, n), whose elements are the sizes of the initial, m, and the final, n, quorums

Two constraints are imposed:

- each final quorum for write must intersect each initial quorum for read
- each final quorum for write must intersect each initial quorum for write

Quorum intersection graph:



For example, the choices of minimal (size) quorums for an object with N=5 replicas:

| Operation | Quorum choices        |
| --------- | --------------------- |
| read      | (1,0) / (2,0) / (3,0) |
| write     | (1,5) / (2,4) / (3,3) |

## Herlihy’s Replication Method

- **timestamps** instead of version numbers
  - clients are able to generate timestamps that can be totally ordered, which will be consistent to that seen by an omniscient observer, hence guaranteeing linearizability
- **logs** instead of versions
- **read**
  - client uses the timestamp instead of the version to identify a replica that is up-to-date
- **write**
  - there is no need to read the versions from an initial quorum, because the timestamp generation already guarantees that the total order is consistent with the order seen by an omniscient observer
  - client needs only write the new state to a final quorum

Only one constraint is imposed:

- each final quorum for write must intersect each initial quorum for read

Quorum intersection graph:



Considering the same example as above:

| Operation | Quorum choices                        |
| --------- | ------------------------------------- |
| read      | (1,0) / (2,0) / (3,0) / (4,0) / (5,0) |
| write     | (0,5) / (0,4) / (0,3) / (0,2) / (0,1) |
