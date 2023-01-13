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

Replication is used to enhance the performance of the system, not the reliability

## Quorum Consensus

**Quorum** is a set of replicas

Let's assume that exists N replicas of a file

To **read** the file, the client needs to assemble a **read quorum**, i.e. an arbitrary collection of **N<sub>R</sub>** servers

To **write** to the file, the client needs to assemble a **write quorum**, i.e. an arbitrary collection of **N<sub>W</sub>** servers

Since a read operation depends on previous write operations, **N<sub>R</sub>** is subject to the constraint **N<sub>R</sub> + N<sub>W</sub> > N** (read quorum must overlap write quorum) -> prevents read-write conflicts

Since a write operation depends on previous write operations, **N<sub>W</sub>** is subject to the constraint **N<sub>W</sub> + N<sub>W</sub> > N** (write quorums must overlap or, in other words, a write quorum must constitute a majority) -> prevents write-write conflicts

**Let f be the maximum number of replicas that may crash simultaneously, then the minimum number of replicas needed for the system to tolerate replicas' unavailability is f+1**

## XA-based Quorum Consensus

Read more

## Transaction-based Quorum Consensus

Read more

## Consistency Models

### Sequential Consistency

The sequential consistency model guarantees that all threads will see the same sequence of memory operations in the same order. In other words, the model ensures that if two memory operations are performed by different threads, they will appear to have been performed in the order in which they were requested, regardless of the actual order in which they were executed by the hardware

**Sequential consistency is not composable** because it requires that all memory operations be ordered in a single global sequence, which means that the order of memory operations performed by different threads cannot be determined independently. This makes it difficult to compose multiple concurrent operations because their ordering may depend on the ordering of other operations

#### Protocol

- **read**: reads from one replica
- **write**: writes to all replicas in same order and does not require a reply
- **snapshot**: reads from one replica

### Linearizability

An execution is linearizable iff it is sequential consistent and if op<sub>1</sub> occurs before op<sub>2</sub>, according to one omniscient observer, then op<sub>1</sub> must appear before op<sub>2</sub>

op<sub>1</sub> occuring before op<sub>2</sub> means that op<sub>1</sub>'s finish time is smaller than op<sub>2</sub>'s start time - if the operations overlap in time, their relative order may be any

#### Protocol

- **read**: reads from one replica
- **write**: writes to all replicas in same order and waits for ack from all replicas before returning
- **snapshot**: reads from one replica

Guaranteeing linearizability usually requires more synchronization

## Quorums-Consensus Replicated ADT

A quorum for an operation is any set of replicas that includes an initial and a final quorums, which can be represented by a pair, (m, n), whose elements are the sizes of the initial, m, and the final, n, quorums

Two constraints are imposed:

- each final quorum for write must intersect each initial quorum for read
- each final quorum for write must intersect each initial quorum for write

Because enq and deq quorums must intersect, the availability of one operation can be increased only if the availability of the other is correspondingly decreased

Similarly, because pairs of deq quorums must intersect, deq cannot be more available than enq

Quorum intersection graph:

![Screenshot from 2023-01-12 14-16-28](https://user-images.githubusercontent.com/55671968/212091045-222c3327-ba09-49d7-8c90-a1f42d9ae2bf.png)

For example, the choices of minimal (size) quorums for an object with N=5 replicas:

| Operation | Quorum choices        |
| --------- | --------------------- |
| read      | (1,0) / (2,0) / (3,0) |
| write     | (1,5) / (2,4) / (3,3) |

## Herlihy’s Method for Quorums-Consensus Replicated ADT

- **timestamps** instead of version numbers
  - clients are able to generate timestamps that can be totally ordered, which will be consistent to that seen by an omniscient observer, hence guaranteeing linearizability
- **logs** instead of versions
- **read**
  - client uses the timestamp instead of the version to identify a replica that is up-to-date
- **write**
  - there is no need to read the versions from an initial quorum, because the timestamp generation already guarantees that the total order is consistent with the order seen by an omniscient observer
  - client needs only write the new state to a final quorum

One disadvantage is that logs grow indefinitely -> is enough to keep the **horizon timestamp**, i.e. the timestamp of the enq entry of the most recently dequeued item (because if an item A has been dequeued, all items enqueued before A must have been dequeued), and **a log with only enq entries, whose timestamps are later than the horizon timestamp**

Only one constraint is imposed:

- each final quorum for write must intersect each initial quorum for read

Quorum intersection graph:

![Screenshot from 2023-01-12 14-16-51](https://user-images.githubusercontent.com/55671968/212091068-1b4085cd-5559-4202-9744-0b07e62a4929.png)

Considering the same example as above:

| Operation | Quorum choices                        |
| --------- | ------------------------------------- |
| read      | (1,0) / (2,0) / (3,0) / (4,0) / (5,0) |
| write     | (0,5) / (0,4) / (0,3) / (0,2) / (0,1) |

### Replicated Queue

- **every initial deq quorum must intersect every final enq quorum**, so that the reconstructed queue reflects all previous enq events
- **every initial deq quorum must intesect every final deq quorum**, so that the reconstructed queue reflects all previous deq events
- **the views for enq operations need not include any prior events**, because enq returns no information about the queue’s state (an initial enq quorum may be empty)

## Byzantine Quorums

### Byzantine Failures

A Byzantine failure is a failure in which a replica may behave arbitrarily

Faulty processes must be fewer than a third of all processes

### Byzantine Quorums

- |U| = n servers (U is the universe of servers)
- Q quorums such that each pair of quorums intersect
- q ∈ Q is a quorum and |q| is its size
- B is the universe of fail-prone servers such that none is contained in another
- b ∈ B is a set that contains all actually faulty servers (distinction: B - fail-prone, b - actually faulty)
- f is the upperbound on byzantine servers (f = max |b|)
- clients perform **read** and **write** operations on x
- a copy of x is stored on each server, along with a timestamp
- different clients must choose different timestamps and thus, each client chooses t ∈ T<sub>c</sub>, such that T<sub>c</sub> does not intersect T<sub>c'</sub> for any other client c'

**Read**

1. operation starts
2. client obtains a set of timestamps from some q
3. client chooses a timestamp t ∈ T<sub>c</sub>, such that
   - t > any timestamp in the set obtained from q
   - t > any timestamp the client has chosen before
4. sends (v,t) to every server in some q' until it has received an ack from each one of them
5. operation ends

**Write**

1. operation starts
2. same as for read operation
3. client applies deterministic function `Result()`
4. operation ends

**We have,**

1. w >= f+1 -> to ensure that writes survives failures
2. w+r > n -> to ensure that read sees most recent write
3. n-f >= r -> read availability
4. n-f >= w -> write availability
5. 2n-2f >= r+w -> from 3 and 4
6. w+r > n <=> 2n-2f > n <=> n > 2f -> from 2 and 5

#### Masking Quorums

- x is written with quorum q<sub>1</sub>
- subsequently, x is read with quorum q<sub>2</sub>
- b are the faulty servers
- then,
  - up-to-date value of x is obtained from (q<sub>1</sub> ∩ q<sub>2</sub>) \ b
  - out-of-date values of x are obtained from q<sub>2</sub> \ (q<sub>1</sub> ∪ b)
  - arbitrary values of x are obtained from q<sub>2</sub> ∩ b

**M-consistency**

- ∀q<sub>1</sub>,q<sub>2</sub> ∈ Q
- ∀b<sub>1</sub>,b<sub>2</sub> ∈ B
- (q<sub>1</sub> ∩ q<sub>2</sub>) \ b<sub>1</sub> ⊄ b<sub>2</sub>

**M-availability**

- ∀b ∈ B
- ∃q ∈ Q
- q ∩ b = ∅ (this is required for liveness)

If f is the upperbound on faulty servers, then we need at least f+1 up-to-date non-faulty servers, thus **every pair of quorums must intersect in at least 2f+1 servers**

Saying that we need at least f+1 non-faulty is equivalent to saying that **n-f >= |q| -> M-availability**

|q|-(n-|q|) >= 2f+1 <=> |q|-n+|q| >= 2f+1 <=> **2|q|-n >= 2f+1 -> M-consistency**

If we combine,

2|q|-n >= 2f+1 <=> 2(n-f)-n >= 2f+1 <=> 2n-2f-n >= 2f+1 <=> **n >= 4f+1**

Let n = 4f+1, then |q| = 3f+1

##### Lemmas/Theorems/Corollaries

- **Lemma 1:** A read operation that is concurrent with no write operations returns the value written by the last preceding write operation in some serialization of all preceding write operations
- **Theorem 1:** Let B a fail-prone system for a universe U. Then there exists a masking quorum system for B iff Q = {U \ b: b ∈ B} is a masking quorum system for B
- **Corollary 1:** Let B a fail-prone system for a universe U. Then there exists a masking quorum system for B iff for all b<sub>1</sub>, b<sub>2</sub>, b<sub>3</sub>, b<sub>4</sub> ∈ B, U ⊄ b<sub>1</sub> ∪ b<sub>2</sub> ∪ b<sub>3</sub> ∪ b<sub>4</sub>. In particular, suppose that B = {b ⊄ U: |b| = f}. Then, what that means is that there exists a masking quorum for B iff n > 4f (which is the same as n >= 4f+1)

#### Dissemination Quorums

**Read**

Very similar to the read operation in masking quorums but, instead of discarding the pairs (v,t) returned from any b, **the system discards all non-verifiable pairs**, i.e. pairs that fail the verification algorithm (not that the timestamps must also be part of the verified information)

**D-consistency**

- ∀q<sub>1</sub>,q<sub>2</sub> ∈ Q
- ∀b ∈ B
- q<sub>1</sub> ∩ q<sub>2</sub> ⊄ b (the intersection of any two quorums must not be contained in any set of potentially faulty servers)

**D-availability**

- ∀b ∈ B
- ∃q ∈ Q
- q ∩ b = ∅ (there should always be at least one quorum that a faulty set cannot disable)

If f is the upperbound on faulty servers, then we need at least f+1 up-to-date non-faulty servers, thus **every pair of quorums must intersect in at least f+1 servers**

Saying that we need at least f+1 non-faulty is equivalent to saying that **n-f >= |q| -> D-availability**

|q|-(n-|q|) >= f+1 <=> |q|-n+|q| >= f+1 <=> **2|q|-n >= f+1 -> D-consistency**

If we combine,

2|q|-n >= f+1 <=> 2(n-f)-n >= f+1 <=> 2n-2f-n >= f+1 <=> **n >= 3f+1**

Let n = 3f+1, then |q| = 2f+1

##### Lemmas/Theorems/Corollaries

- **Lemma 1:** same as for masking quorums
- **Lemma 2:** A read operation that is concurrent with one or more write operations returns either the value written by the last preceding write operation in some serialization of all preceding write operations, or any of the values being written in the concurrent write operations
- **Theorem 1:** same as for masking quorums, but instead of 'masking quorums', is 'dissemination quorums'
- **Corollary 1:** same as for masking quorums, but instead of n > 4f, is n > 3f

# Practical Byzantine Fault-Tolerance

# Scalable Distributed Topologies

# Blockchain
