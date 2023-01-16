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
- to address this issue, the application must be able to synchronize w/ the remote end to learn if there was some data loss in either direction
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
- messages sent **in the context of a session** to a queue are delivered in the sending order (this guarantee only applies to messages w/ the same delivery mode - see below)
- does not guarantee interoperability, i.e. a JMS provider being able to communicate w/ another JMS provider, which may be a limitation in cases where one needs to integrate different JMS providers

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

I recommend reading the section 7.5.3 of van Steen and Tanenbaum, Distributed Systems, 3rd Ed., which can be found [here](https://www.pdfdrive.com/distributed-systems-3rd-edition-d189433770.html)

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

For example, the choices of minimal (size) quorums for an object w/ N=5 replicas:

| Operation | Quorum choices        |
| --------- | --------------------- |
| read      | (1,0) / (2,0) / (3,0) |
| write     | (1,5) / (2,4) / (3,3) |

## Herlihy’s Method for Quorums-Consensus Replicated ADT

I recommend reading the paper [A Quorum-Consensus Replication Method for Abstract Data Types, by Maurice Herlihy](https://www.cs.utexas.edu/~lorenzo/corsi/cs395t/04S/notes/p32-herlihy.pdf)

- **timestamps** instead of version numbers
  - clients are able to generate timestamps that can be totally ordered, which will be consistent to that seen by an omniscient observer, hence guaranteeing linearizability
- **logs** instead of versions
- **read**
  - client uses the timestamp instead of the version to identify a replica that is up-to-date
- **write**
  - there is no need to read the versions from an initial quorum, because the timestamp generation already guarantees that the total order is consistent w/ the order seen by an omniscient observer
  - client needs only write the new state to a final quorum

One disadvantage is that logs grow indefinitely -> is enough to keep the **horizon timestamp**, i.e. the timestamp of the enq entry of the most recently dequeued item (because if an item A has been dequeued, all items enqueued before A must have been dequeued), and **a log w/ only enq entries, whose timestamps are later than the horizon timestamp**

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

I recommend reading the paper [A Quorum-Consensus Replication Method for Abstract Data Types, by Maurice Herlihy](https://www.cs.utexas.edu/~lorenzo/corsi/cs395t/04S/notes/p32-herlihy.pdf) and the blog entry [Quorum Systems by Anh Dinh](https://dinhtta.github.io/quorum/)

### Byzantine Failures

A Byzantine failure is a failure in which a replica may behave arbitrarily

Faulty processes must be fewer than a third of all processes

### Byzantine Quorums

- |U| = n servers (U is the universe of servers)
- Q quorums s.t. each pair of quorums intersect
- q ∈ Q is a quorum and |q| is its size
- B is the universe of fail-prone servers s.t. none is contained in another
- b ∈ B is a set that contains all actually faulty servers (distinction: B - fail-prone, b - actually faulty)
- f is the upperbound on byzantine servers (f = max |b|)
- clients perform **read** and **write** operations on x
- x is written w/ quorum q<sub>w</sub> and read w/ quorum q<sub>r</sub>
- a copy of x is stored on each server, along w/ a timestamp
- different clients must choose different timestamps and thus, each client chooses t ∈ T<sub>c</sub>, s.t. T<sub>c</sub> does not intersect T<sub>c'</sub> for any other client c'

**Read**

1. operation starts
2. client obtains a set of timestamps from some q
3. client chooses a timestamp t ∈ T<sub>c</sub>, s.t.
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

- up-to-date value of x is obtained from (q<sub>w</sub> ∩ q<sub>r</sub>) \ b
- out-of-date values of x are obtained from q<sub>w</sub> \ (q<sub>r</sub> ∪ b)
- arbitrary values of x are obtained from q<sub>r</sub> ∩ b

**M-consistency**

- ∀q<sub>w</sub>,q<sub>r</sub> ∈ Q
- ∀b<sub>1</sub>,b<sub>2</sub> ∈ B
- (q<sub>w</sub> ∩ q<sub>r</sub>) \ b<sub>1</sub> ⊄ b<sub>2</sub>

**M-availability**

- ∀b ∈ B
- ∃q ∈ Q
- q ∩ b = ∅ (this is required for liveness)

f is the upperbound on faulty servers -> we need at least f+1 up-to-date non-faulty servers (M-availability: n-f >= |q|) -> **every pair of quorums must intersect in at least 2f+1 (f + f+1) servers** -> |q<sub>w</sub> ∩ q<sub>r</sub>) \ b| > |b| <=> |q<sub>w</sub> ∩ q<sub>r</sub>| > 2f

![image](https://user-images.githubusercontent.com/55671968/212310731-533f8616-2776-4648-8e7c-b4d8d70fbe7d.png)

|q|-(n-|q|) >= 2f+1 <=> |q|-n+|q| >= 2f+1 <=> **2|q|-n >= 2f+1 -> M-consistency**

If we combine,

2|q|-n >= 2f+1 <=> 2(n-f)-n >= 2f+1 <=> 2n-2f-n >= 2f+1 <=> **n >= 4f+1**

Let n = 4f+1, then |q| = 3f+1

##### Lemmas/Theorems/Corollaries

- **Lemma 1:** A read operation that is concurrent w/ no write operations returns the value written by the last preceding write operation in some serialization of all preceding write operations
- **Theorem 1:** Let B a fail-prone system for a universe U. Then there exists a masking quorum system for B iff Q = {U \ b: b ∈ B} is a masking quorum system for B
- **Corollary 1:** Let B a fail-prone system for a universe U. Then there exists a masking quorum system for B iff for all b<sub>1</sub>, b<sub>2</sub>, b<sub>3</sub>, b<sub>4</sub> ∈ B, U ⊄ b<sub>1</sub> ∪ b<sub>2</sub> ∪ b<sub>3</sub> ∪ b<sub>4</sub>. In particular, suppose that B = {b ⊄ U: |b| = f}. Then, what that means is that there exists a masking quorum for B iff n > 4f (which is the same as n >= 4f+1)

#### Dissemination Quorums

- up-to-date value of x is obtained from (q<sub>w</sub> ∩ q<sub>r</sub>) \ b
- out-of-date values of x are obtained from q<sub>w</sub> \ up-to-date

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

f is the upperbound on faulty servers -> we need at least f+1 up-to-date non-faulty servers (D-availability: n-f >= |q|) -> **every pair of quorums must intersect in at least f+1 servers**

![image](https://user-images.githubusercontent.com/55671968/212310750-98dd8413-33d1-41da-b432-c11a39625747.png)

|q|-(n-|q|) >= f+1 <=> |q|-n+|q| >= f+1 <=> **2|q|-n >= f+1 -> D-consistency**

If we combine,

2|q|-n >= f+1 <=> 2(n-f)-n >= f+1 <=> 2n-2f-n >= f+1 <=> **n >= 3f+1**

Let n = 3f+1, then |q| = 2f+1

##### Lemmas/Theorems/Corollaries

- **Lemma 1:** same as for masking quorums
- **Lemma 2:** A read operation that is concurrent w/ one or more write operations returns either the value written by the last preceding write operation in some serialization of all preceding write operations, or any of the values being written in the concurrent write operations
- **Theorem 1:** same as for masking quorums, but instead of 'masking quorums', is 'dissemination quorums'
- **Corollary 1:** same as for masking quorums, but instead of n > 4f, is n > 3f

# Practical Byzantine Fault-Tolerance

## FLP’s Impossibility Result

**Safety:** agreement (no two correct processes decide differently) and validity (the decided value depends on the input of the processes)

**Liveness:** every execution of a protocol decides a value

**Theorem:** in an asynchronous system in which at least one process may crash, there is no deterministic consensus protocol that is both live and safe

The intuition behind the theorem is that, in asynchronous distributed systems, one cannot distinguish a slow process from a crashed process and so, there will always be the possibility of certain executions reaching a state where:

- if a process takes no decision, it may remain forever undecided, thus violating liveness
- if a process makes a decision, independently of the decision rule, it may violate one of the safety properties

## System Model

I recommend reading the paper [Byzantine quorum systems, by Dahlia Malkhi and Michael Reiter](https://dahliamalkhi.files.wordpress.com/2015/12/byzquorums-distcomputing1998.pdf) and the section 8.2.5 of van Steen and Tanenbaum, Distributed Systems, 3rd Ed., which can be found [here](https://www.pdfdrive.com/distributed-systems-3rd-edition-d189433770.html)

**Notation**

- d = D(m): message m's digest
- {m}<sub>i</sub>: message m signed by process i
- PC: prepared certificate
- CC: commit certificate
- VC: new-view certificate

Since f nodes may fail, it should be possible to proceed after communicating w/ at least n-f nodes

However, one can be able to communicate w/ nodes that are faulty or not be able to communicate w/ nodes that are not faulty simply because they are slower

There is the possibility of all nodes that responded being also faulty and so one needs to make sure that the non-faulty nodes outnumber the faulty ones -> (n-f)-f > f <=> **n > 3f** (n >= 3f+1 -> recall dissemination quorum systems -> quorums intersect in at least 1 replica -> quorums of f+1 replicas)

- **view** is a numbered system configuration
- **each view has a leader** (l = v mod n)
- n >= 3f+1 replicas

### Normal Case Operation

- 3-phase algorithm - when the leader receives a request m from one of the clients, it starts this algorithm to atomically multicast the request to the replicas
  - **pre-prepare** - picks order of requests
  - **prepare** - ensures order w/in views
  - **commit** - ensures order across views
- replicas remember messages in log
- messages are signed

#### PRE-PREPARE

- leader receives request m
- assigns sequence number n to m
- multicasts {{PRE-PREPARE, v, n, d}<sub>l</sub>, m}
- a replica accepts PRE-PREPARE if
  1. it is in view v
  2. the signatures are valid
  3. it has not already accepted a PRE-PREPARE for the same v and n w/ a different digest
  4. h > n > H (n is between the low and high water marks)
- by accepting, enters PREPARE phase

#### PREPARE

- each replica i that accepts to pre-prepare multicasts message {PREPARE, v, n, d, i}<sub>i</sub>
- a replica accepts PREPARE if conditions 1, 2 and 4 apply
- replicas collect its own PRE-PRPARE plus 2f matching PREPARE messages -> PC(m,v,n)
- after collecting a PC, a replica has prepared the request and enters COMMIT phase
- this ensures consistent ordering w/in a view, because one can never get two PCs w/ same v and n for different requests
  - to obtain a PC for m in v w/ n, 2f+1 replicas must have either sent or accepted a PRE-PREPARE in v w/ n
  - the quorums have, at least, f+1 replicas in common
  - thus, at least 1 non-faulty replica would have to have either sent or accepted two PRE-PREPARE messages in v w/ n for different requests, m and m', which is not possible by the protocol

#### COMMIT

- replica i multicasts message {COMMIT, v, n, d, i}<sub>i</sub>
- a replica accepts COMMIT if conditions 1, 2 and 4 apply
- replicas collect its own plus 2f matching COMMIT messages -> CC(m,v,n)
- after collecting both PC and CC, a replica has commited the request
- now replica can go ahead and execute the request (only it has executed all requests w/ a lower n)
- this phase ensures that if a replica commited a request, that request was prepared by, at least, f+1 non-faulty replicas
  - to obtain a CC for m in v w/ n, a replica must have accepted matching COMMIT messages from 2f+1 replicas
  - since there are, at most, f faulty replicas, at least f+1 non-faulty replicas sent COMMIT
  - by the protocol, a non-faulty replica can only send COMMIT after it has prepared the request

### View Change Protocol

I recommend reading the blog entry [Subtle Details in PBFT by Anh Dinh](https://dinhtta.github.io/pbft/)

- to ensure liveness upon failure of the leader, while ensuring safety
- leader failure is suspected on timeout or on evidence of faulty behaviour
- what we wish to establish is that a request that was still being processed at the time the leader failed, will eventually get executed once and only once by all non-faulty servers
- to this end, we first need to ensure that, regardless v, there are no two CCs w/ the same n but different requests or, in other words, we need to make sure that the new leader does not use old sequence numbers for new requests
- this situation can be prevented by having 2f+1 CCs just as before, but this time based on PCs - in other words, we want to regenerate CCs, but now for v+1, and only to make sure that a non-faulty server is not missing any operation
- note that we may be generating a CC for an operation that a server had already executed (which can be observed by looking at the sequence numbers), but that CC will be ignored by the server as long as it keeps an account of its own execution history

#### 1ST PHASE

- upon leader suspicion in view v, replica i starts view change protocol
- multicasts {VIEW-CHANGE, v+1, n, C, P, i}<sub>i</sub>
  - n: the sequence number of the last stable checkpoint known to i
  - C: that checkpoint's stable certificate
  - P: set w/ a PC for each request prepared at replica i w/ sequence number greater than n

#### 2ND PHASE

- leader of view v+1 collects 2f+1 valid VIEW-CHANGE messages for v+1 -> VC(m,v,n)
- multicasts {NEW-VIEW, v+1, V, O, N}<sub>l</sub>
  - V: VC
  - O/N: set of PRE-PREPARE messages (w/out the respective requests) that propagate sequence number assignments from previous views

##### Computation of O

- the leader, l, of v+1 determines the sequence numbers h (the latest stable checkpoint in V) and H (the highest in a message in a PC in V)
- for each n s.t. h <= n <= H, (?? not sure if it is for each)
  - creates {PRE-PREPARE, v+1, n, d}<sub>l</sub> and adds it to O, s.t. d is the digest of the PC(m,v',n), if there is one in V, w/ the hightest view number v'
  - or creates {PRE-PREPARE, v+1, n, null}<sub>l</sub> and adds it to N, whereas this time digest d is null because there is no PC(_,_,n) in V
- appends the messages in O and N to its log, as they belong to the PRE-PREPARE phase for these requests in the new view

#### Correctness: safety

Safety depends on all non-faulty replicas agreeing on the sequence numbers of requests that commit locally

For local commits at

- the same view -> ensured by the PRE-PREPARE and PREPARE phases
- different views -> ensured by the view change protocol

# Scalable Distributed Topologies

- **walk**: edges and vertices can be repeated
- **trail**: only vertices can be repeated
- **path**: no repeated vertices or edges
- **complete graph**: each pair of vertices has an edge connecting them
- **connected graph**: there is a path between any two vertices
- **planar graph**: can be drawn in the plane w/out crossing edges
- **connected component**: maximal connected subgraph
- **eccentricity**: maximum distance from a vertex to any other vertex in the graph
- **diameter**: maximum eccentricity
- **radius**: minimum eccentricity
- **center**: vertices whose eccentricity is equal to its radius
- **peripheral**: vertices whose eccentricity is equal to its diameter

**A random geometric graph is not guaranteed to be planar.** However, the probability of a random geometric graph being planar increases as the distance threshold for adding edges decreases, as there will be fewer edges and thus a smaller chance of edges crossing. It is possible to show that if the threshold distance is less than the square root of (ln(n)/n) where n is the number of vertices, then the graph is almost surely planar.

## Reliable FIFO send/receive channels

- `send` is the same as enq
- `receive` is the same as deq
- `cause(receive)` is a function that maps the receive event to its corresponding preceding send
- `cause` is **surjective**, i.e. for every send there must be a receive because no messages are lost, and **injective**, i.e. for every receive there must be a distinct send because no messages are duplicated
- receive < receive' => cause(receive) < cause(receive'), i.e. order is preserved

## Spanning Trees

Read more on AsyncSpanningTree algorithm

## Epidemic Broadcast Trees

- **gossip broadcast**: + highly scalable and resilient, - excessive message overhead
- **tree-based broadcast**: + small message complexity, - fragile in the presence of failures

# System Design for Large Scale

**Law of diminishing returns:** in a production system w/ fixed and variable inputs, beyond some point, each additional unit of variable input yields less and less additional output

### Distributed Hash Tables - DHTs

- DHTs provide ways of mapping keys to network nodes
- node joins and leaves should be accounted for in the protocols, in order to preserve some structure in the routing supporting the DHT
- DHTs can require more maintenance than unstructured P2P systems

#### Chord

- nodes and keys are assigned unique IDs in an ID space from 0 to 2<sup>m</sup>-1 based on SHA-1 hash function
- nodes and keys are arranged in a logical ring module 2<sup>m</sup>
- each node maintains a finger table, which is a list of other nodes in the network that it is directly connected to
- the distance function used in Chord can be expressed as d(x,y) = (y−x) mod 2<sup>m</sup>
- when a new node joins the network, it uses the finger table of other nodes to find its place in the ring and update its finger table accordingly
- each node is responsible for a range of keys, known as its "successor space", and it stores the keys that fall w/in that range
- for a given key, its successor node is the node w/ the smallest ID that is larger than the key's ID
- nodes keep O(log n) knowledge on other nodes and routing takes O(log n) steps

#### Kademlia

- nodes and keys share a 160 bits ID space
- ID distance is computed using the XOR metric, which satisfies the triangle inequality
- each node maintains a (bucket-based) routing table, which is a list of other nodes in the network that it is directly connected to
- the distance function used in Kademlia is d(x,y) = x XOR y
- when a new node joins the network, it uses the routing table of other nodes to find its place in the network and update its routing table accordingly
- the key-value pairs are stored on the nodes according to the key's distance to the node's ID - the nodes closer to the key will store the key-value pair
- has a more efficient way to find the closest nodes to a key, called "parallel lookups" which improves the performance and reduces the network load

![image](https://user-images.githubusercontent.com/55671968/212494205-07276c00-529a-4872-a2ff-3d34719ee2b7.png)

# Physical and Logical Time

I recommend watching the following videos (especially the two last ones, for a much clear understanding of vector clocks):

1. [Distributed Systems 3.1: Physical time](https://www.youtube.com/watch?v=FQ_2N3AQu0M&list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB&index=9&ab_channel=MartinKleppmann)
2. [Distributed Systems 3.2: Clock synchronisation](https://www.youtube.com/watch?v=mAyW-4LeXZo&list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB&index=10&ab_channel=MartinKleppmann)
3. [Distributed Systems 3.3: Causality and happens-before](https://www.youtube.com/watch?v=OKHIdpOAxto&list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB&index=11&ab_channel=MartinKleppmann)
4. [Distributed Systems 4.1: Logical time](https://www.youtube.com/watch?v=x-D8iFU1d-o&list=PLeKd45zvjcDFUEv_ohr_HdUFe97RItdiB&index=12&ab_channel=MartinKleppmann)

## Time synchronization

- **external:** states a precision w.r.t. an authoritative reference
  - for a band D>0 and UTC source S, |S(t)-C<sub>i</sub>(t)| < D
- **internal:** states a precision between two nodes (note that if one is authoritative -> external)
  - for a band D>0 we have |C<sub>j</sub>(t)-C<sub>i</sub>(t)| < D

Some uses (e.g. make) require time monotonicity

### Time Synchronization on Synchronous Systems

- considering the transit time trans and receiving origin time t, one could set to t+trans
- however, trans can vary between t<sub>min</sub> and t<sub>max</sub>
- using t+t<sub>min</sub> or t+t<sub>max</sub> the uncertainty is u=t<sub>max</sub>-t<sub>min</sub>
- but, using t+(t<sub>min</sub>+t<sub>max</sub>)/2 the uncertainty is u/2

### Time Synchronization on Asynchronous Systems

**Cristian's algorithm** works between a process and a time server connected to a time reference source

- let P be the process and S the time server
- P requests the time from S at time t
- upon receiving the request from P, S prepares a response and appends the time T from its own clock
- P receives the response at time t' then sets its time to be T+RTT/2, where RTT=t'-t
- precision can be increased by repeating the protocol until a low RTT occurs

Unlike Cristian's algorithm, the server process in the **Berkeley algorithm**, called the leader, periodically polls other follower processes

- let L be the leader process, F<sub>i</sub> ∈ F a follower process and F the follower processes
- L is chosen via an election process
- L polls F, who reply with their time in a similar way to Cristian's algorithm
- L observes the RTT of the messages and estimates the time of each F<sub>i</sub> and its own
- L then averages the clock times, ignoring any values it receives far outside the values of the others
- instead of sending the updated current time back to the other process, L then sends out the amount (positive or negative) that each F<sub>i</sub> must adjust its clock
- this avoids further uncertainty due to RTT at F

# High Availability under Eventual Consistency

I recommend watching the video [Distributed Systems 7.3: Eventual consistency](https://www.youtube.com/watch?v=9uCP3qHNbWw&ab_channel=MartinKleppmann)

# Blockchain

I recommend watching the following videos:

1. [But how does bitcoin actually work?](https://www.youtube.com/watch?v=bBC-nXj3Ng4&ab_channel=3Blue1Brown)
2. [L12: What is a Blockchain?](https://www.youtube.com/watch?v=Jp7T9qtuRIE&ab_channel=DistributedSystemsCourse)
3. [L13: Bitcoin Blockchain Consensus](https://www.youtube.com/watch?v=f1ZJPEKeTEY&ab_channel=DistributedSystemsCourse)

## Tendermint

Based on the papers [Tendermint: Consensus without Mining](https://tendermint.com/static/docs/tendermint.pdf) and [The latest gossip on BFT consensus](https://arxiv.org/pdf/1807.04938.pdf) explanation.

- 3 steps: **propose**, **prevote**, **precommit (which includes a special step - commit)**, each of which has a timeout
- each round is longer than the previous round by a small fixed increment of time - this allows the network to eventually achieve consensus in a partially synchronous network
- each round has a designated proposer chosen in round-robin fashion such that validators are chosen with frequency in proportion to their voting power
- the protocol assumes n > 3f, so more than 2/3 of the nodes correspond to, at least, 2f+1 nodes
- at any time during the process if a node
  - receives more than 2/3 of commits for a particular block, it immediately enters the commit step (a commit-vote for a block at round R counts as prevotes and precommits for all rounds R' where R < R')
  - is locked on a block from round R but receives a proof-of-lock for a round R' where R < R', the node unlocks

### Propose

- the proposer broadcasts a proposal to its peers via gossip
  - if the proposer is locked on a block from some prior round it proposes the locked block and includes a proof-of-lock in the proposal
- all nodes gossip the proposal to their neighboring peers

### Prevote

- in the beginning of this step each validator makes a decision
  - if the validator is locked on a proposed block from some prior round, it signs and broadcasts a prevote for the locked block, otherwise
  - if the validator had received an acceptable proposal for the current round, then it signs and broadcasts a prevote for the proposed block
  - if the validator had received no proposal or an invalid one, it signs a special nil prevote
- no locking happens during this step
- all nodes gossip all prevotes for the round to their neighboring peers

### Precommit

- in the beginning of this step each validator makes a decision
  - if the validator had received more than 2/3 of prevotes for a particular acceptable block then the validator signs and broadcasts a precommit for that block, locks onto that block and releases any prior locks
  - if the node had received more than 2/3 of nil prevotes then it simply unlocks
- when locking (or unlocking), the node gathers the prevotes for the locked block (or the prevotes for nil) and packages them into a proof-of-lock for later when it is its turn to propose
- all nodes gossip all precommits for the round to all neighboring peers
- at the end of this step each node makes a decision
  - if the node had received more than 2/3 of precommits for a particular block, then the node enters the commit step (even if a node hadn’t yet received the block precommitted by the network, it enters the commit step)
  - otherwise it continues onto the propose step of the next round

#### Commit

- there are two parallel conditions that must both be satisfied before finalizing the round
  1. the node must receive the block committed by the network if it hadn’t already (once the block is received by a validator it signs and broadcasts a commit for that block)
  2. the node must wait until it receive at least 2/3 of commits for the block precommitted by the network
