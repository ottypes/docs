# Operational transform types, sir?

We have a lovely buffet of operational transform types. Each type has many fine
features, including thorough testing, browser support and documentation. Each
type has its own project in this github organization.

These types have been finely aged in
[ShareJS](https://github.com/josephg/sharejs)'s type labs, and now they're
ready to enter the world and be used by everyone. We are rather proud of them.

Each type defines a set of standard methods for programatic use. You should be
able to define a type using the spec then plug it directly into ShareJS (or
other compatible collaborative editing systems) and use it immediately. The
type defines how operations and documents are stored and manipulated, while a
system like sharejs can decide where the data should be stored on disk, network
protocols and all that jazz.

## Available OT types

This repository contained three OT types. They were split to separate repositories:

### [ot-text](https://github.com/ottypes/text)

This is the type you should use for normal plain-text editing. It can tranform operation with complexity N against operation with complexity M in O(N+M) time. This makes it much faster than ot-text-tp2 implementation.

### [ot-text-tp2](https://github.com/ottypes/text)

This implementation features [Transform Property 2](http://en.wikipedia.org/wiki/Operational_transformation#Convergence_properties) which makes it a good suit for peer-to-peer communication. Unfortunately the extra (unnecessary) complexity kills v8's optimizer and as a result ot-text-tp2 goes about 20x slower than the ot-text type. If you're using client-server library like ShareJS, you don't need TP2 property, so you should use simpler ot-text implementation,

### [ot-json0](https://github.com/ottypes/json0)

This implementation is capable of transforming not only text but also JSON structures. Unfortunately this implementation uses slow transformation alogirithm that takes O(N*M) time in contrast to O(N+M) time for ot-text type. That's why you shouldn't use this type if you want to transform just plain text.

### [rich-text](https://github.com/ottypes/rich-text)

This is an OT implementation for collaboratively editing rich text documents. It was designed alongside [QuillJS](http://quilljs.com/) for editing those documents.

## Javascript Spec

Each OT type exposes a single object with the following properties. Note that
only *name*, *create*, *apply* and *transform* are strictly required, though
most types should also include *url* and *compose*.

There is a simple example of a working type in [example.js](example.js). For a
more thorough example, take a look at [the text type](/ottypes/text).

If you're publishing your library in npm (and you should!), the module should
expose an object with a `.type` property (containing your type). So for
example, `require('ot-text').type.name` contains the text type's name.

### Standard properties

- **name**: A user-readable name for the type. This is not guaranteed to be unique.
- **uri**: *(Optional, will be required soon)* A canonical location for this type. The spec for the OT type should be at this address. Remember kids, Tim Berners-Lee says [cool URLs don't change](http://www.w3.org/Provider/Style/URI.html).
- **create([initialData]) -> snapshot**: A function to create the initial document snapshot. Create may accept initial snapshot data as its only argument. Either the return value must be a valid target for `JSON.stringify` or you must specify *serialize* and *deserialize* functions (described below).
- **apply(snapshot, op) -> snapshot'**: Apply an operation to a document snapshot. Returns the changed snapshot. For performance, old document must not be used after this function call, so apply may reuse and return the current snapshot object.
- **transform(op1, op2, side) -> op1'**: Transform op1 by op2. Return the new op1. Side is either `'left'` or `'right'`. It exists to break ties, for example if two operations insert at the same position in a string. Both op1 and op2 must not be modified by transform.
Transform must conform to Transform Property 1. That is, apply(apply(snapshot, op1), transform(op2, op1, 'left')) == apply(apply(snapshot, op2), transform(op1, op2, 'right')).
- **compose(op1, op2) -> op**: *(optional)* Compose op1 and op2 to produce a new operation. The new operation must subsume the behaviour of op1 and op2. Specifically, apply(snapshot, apply(op1), op2) == apply(snapshot, compose(op1, op2)). Note: transforming by a composed operation is *NOT* guaranteed to produce the same result as transforming by each operation in order. This function is optional, but unless you have a good reason to do otherwise, you should provide a compose function for your type.

### Optional properties

- **invert(op) -> op'**: *(optional)* Invert the given operation. The original operation must not be edited in the process. If supplied, apply(apply(snapshot, op), invert(op)) == snapshot.
- **normalize(op) -> op'**: *(optional)* Normalize an operation, converting it to a canonical representation. normalize(normalize(op)) == normalize(op).
- **transformCursor(cursor, op, isOwnOp) -> cursor'**: *(optional)* transform the specified cursor by the provided operation. If isOwnOp is true, this function should return the final editing position of the provided operation. If isOwnOp is false, the cursor position should move with the content to its immediate left.
- **serialize(snapshot) -> data**: *(optional)* convert the document snapshot data into a form that may be passed to JSON.stringify. If you have a *serialize* function, you must have a *deserialize* function.
- **deserialize(data) -> snapshot**: *(optional)* convert data generated by *serialize* back into its internal snapshot format. deserialize(serialize(snapshot)) == snapshot. If you have a *deserialize* function, you must have a *serialize* function.

> Do I need serialize and deserialize? Maybe JSON.stringify is sufficiently customizable..?

### TP2 Properties

If your OT type supports [transform property 2](http://en.wikipedia.org/wiki/Operational_transformation#Convergence_properties), set the *tp2* property to true and define a *prune* function.

Transform property 2 is an additional requirement on your *transform* function. Specifically, transform(op3, compose(op1, transform(op2, op1)) == transform(op3, compose(op2, transform(op1, op2)).

- **tp2**: *(optional)* Boolean property. Make this truthy to declare that the type has tp2 support. Types with TP2 support must define *prune*.
- **prune(op, otherOp)**: The inverse of transform. Formally, apply(snapshot, op1) == apply(snapshot, prune(transform(op1, op2), op2)). Usually, prune will simply be the inverse of transform and prune(transform(op1, op2), op2) == op1.

### CRDTs

Technically, CRDT types are a subset of OT types. Which is to say, they *are*
OT types that don't need a transform function. As a result, anything that can
handle these OT types should also be able to consume CRDTs. But I haven't
tested it. If anyone wants to work with me to add CRDT support here, [email
me](mailto:josephg.com).

---

# License

All code contributed to this repository is licensed under the standard MIT license:

Copyright 2011 ottypes library contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following condition:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

