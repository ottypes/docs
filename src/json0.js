/*
 This is the implementation of the JSON OT type.

 Spec is here: https://github.com/josephg/ShareJS/wiki/JSON-Operations

 Note: This is being made obsolete. It will soon be replaced by the JSON2 type.
*/

(function() {

    /**
     * UTILITY FUNCTIONS
     * These are quite common in JavaScript and should probably
     * be shared across the other type implementations.
     */

    /**
     * Alias for Object's toString function.
     * @type {*}
     */
    var toString = Object.prototype.toString;

    /**
     * Checks if the passed object is not defined
     * @param obj
     * @returns {boolean}
     */
    var isUndefined = function(obj) {
      return obj === void 0;
    };

    /**
     * Checks if the passed object is defined
     * @param obj
     * @returns {boolean}
     */
    var isDefined = function(obj) {
        return obj !== void 0;
    };

    /**
     * Checks if the passed object is a String instance
     * @param obj
     * @returns {boolean}
     */
    var isString = function(obj) {
      return toString.call(obj) == '[object String]';
    };

    /**
     * Checks if the passed object is a Number instance
     * @param obj
     * @returns {boolean}
     */
    var isNumber = function(obj) {
      return toString.call(obj) == '[object Number]';
    };

    /**
     * Checks if the passed object is an Array instance
     * @param obj
     * @returns {boolean}
     */
    var isArray = function(obj) {
        return toString.call(obj) == '[object Array]';
    };

    /**
     * Clones the passed object using JSON serialization (which is slow).
     *
     * hax, copied from test/types/json. Apparently this is still the fastest way to deep clone an object, assuming
     * we have browser support for JSON.
     * @see http://jsperf.com/cloning-an-object/12
     */
    var clone = function(o) {
        return JSON.parse(JSON.stringify(o));
    };



    /**
     * Reference to the Text OT type. This is used for the JSON String operations.
     * @type {*}
     */
    var text = typeof window !== "undefined" && window !== null ?
            window.ottypes.text :
            require('./text-old');



    /**
     * JSON OT Type
     * @type {*}
     */
    var json = {};

    json.name = 'json0';
    json.uri = 'http://sharejs.org/types/JSONv0';

    json.create = function() {
        return null;
    };

    json.invertComponent = function(c) {
        var c_ = {
            p: c.p
        };

        if(isDefined(c.si)) c_.sd = c.si;
        if(isDefined(c.sd)) c_.si = c.sd;
        if(isDefined(c.oi)) c_.od = c.oi;
        if(isDefined(c.od)) c_.oi = c.od;
        if(isDefined(c.li)) c_.ld = c.li;
        if(isDefined(c.ld)) c_.li = c.ld;
        if(isDefined(c.na)) c_.na = -c.na;

        if(isDefined(c.lm)) {
            c_.lm = c.p[c.p.length-1];
            c_.p = c.p.slice(0,c.p.length-1).concat([c.lm]);
        }

        return c_;
    };

    json.invert = function(op) {
        var op_ = op.slice().reverse();
        var iop = [];
        for(var i = 0; i < op_.length; i++) {
            iop.push(json.invertComponent(op_[i]));
        }
        return iop;
    };

    json.checkValidOp = function(op) {
    };

    json.checkList = function(elem) {
        if(!isArray(elem))
            throw new Error('Referenced element not a list');
    };

    json.checkObj = function(elem) {
        if(elem.constructor !== Object) {
            throw new Error("Referenced element not an object (it was " + JSON.stringify(elem) + ")");
        }
    };

    json.apply = function(snapshot, op) {
        json.checkValidOp(op);

        op = clone(op);

        var container = {
            data: snapshot
        };

        for(var i = 0; i < op.length; i++) {
            var c = op[i];

            var parent = null;
            var parentKey = null;
            var elem = container;
            var key = 'data';

            for(var j = 0; j < c.p.length; j++) {
                var p = c.p[j];

                parent = elem;
                parentKey = key;
                elem = elem[key];
                key = p;

                if(parent == null)
                    throw new Error('Path invalid');
            }

            // Number add
            if(isDefined(c.na)) {
                if(!isNumber(elem[key]))
                    throw new Error('Referenced element not a number');

                elem[key] += c.na;
            }

            else

            // String insert
            if(isDefined(c.si)) {
                if(!isString(elem))
                    throw new Error('Referenced element not a string (it was '+JSON.stringify(elem)+')');

                parent[parentKey] = elem.slice(0,key) + c.si + elem.slice(key);
            }

            else

            // String delete
            if(isDefined(c.sd)) {
                if(!isString(elem))
                    throw new Error('Referenced element not a string');

                if(elem.slice(key,key + c.sd.length) !== c.sd)
                    throw new Error('Deleted string does not match');

                parent[parentKey] = elem.slice(0,key) + elem.slice(key + c.sd.length);
            }

            else

            // List replace
            if(isDefined(c.li) && isDefined(c.ld)) {
                json.checkList(elem);
                // Should check the list element matches c.ld
                elem[key] = c.li;
            }

            else

            // List insert
            if(isDefined(c.li)) {
                json.checkList(elem);
                elem.splice(key,0, c.li);
            }

            else

            // List delete
            if(isDefined(c.ld)) {
                json.checkList(elem);
                // Should check the list element matches c.ld here too.
                elem.splice(key,1);
            }

            else

            // List move
            if(isDefined(c.lm)) {
                json.checkList(elem);
                if(c.lm != key) {
                    var e = elem[key];
                    // Remove it...
                    elem.splice(key,1);
                    // And insert it back.
                    elem.splice(c.lm,0,e);
                }
            }

            else

            // Object insert / replace
            if(isDefined(c.oi)) {
                json.checkObj(elem);

                // Should check that elem[key] == c.od
                elem[key] = c.oi;
            }

            else

            // Object delete
            if(isDefined(c.od)) {
                json.checkObj(elem);

                // Should check that elem[key] == c.od
                delete elem[key];
            }

            else {
                throw new Error('invalid / missing instruction in op');
            }
        }

        return container.data;
    };

    // Checks if two paths, p1 and p2 match.
    json.pathMatches = function(p1,p2,ignoreLast) {
        if(p1.length != p2.length)
            return false;

        for(var i = 0; i < p1.length; i++) {
            var p = p1[i];
            if(p !== p2[i] && (!ignoreLast || i !== p1.length - 1))
                return false;
        }

        return true;
    };

    // NOTE: Coffeescript returns the last statement in a block, however, the return value of this function doesn't seem
    //       to be consumed anywhere. The tests still pass after stripping out all the returns.
    json.append = function(dest,c) {
        c = clone(c);

        var last;

        if(dest.length != 0 && json.pathMatches(c.p,(last = dest[dest.length - 1]).p)) {
            if(isDefined(last.na) && isDefined(c.na)) {
                return dest[dest.length - 1] = {
                    p: last.p,
                    na: last.na + c.na
                };
            }
            else if(isDefined(last.li) && isUndefined(c.li) && c.ld === last.li) {
                // insert immediately followed by delete becomes a noop.
                if(isDefined(last.ld)) {
                    // leave the delete part of the replace
                    return delete last.li;
                } else {
                    return dest.pop();
                }
            }
            else if(isDefined(last.od) && isUndefined(last.oi) && isDefined(c.oi) && isUndefined(c.od)) {
                return last.oi = c.oi;
            }
            else if(isDefined(c.lm) && c.p[c.p.length - 1] === c.lm) {
                // don't do anything
                return null;
            }
            else {
                return dest.push(c);
            }
        } else {
            return dest.push(c);
        }
    };

    json.compose = function(op1,op2) {
        json.checkValidOp(op1);
        json.checkValidOp(op2);

        var newOp = clone(op1);

        for(var i = 0; i < op2.length; i++) {
            json.append(newOp,op2[i]);
        }

        return newOp;
    };

    json.normalize = function(op) {
        var newOp = [];

        op = isArray(op) ? op : [op];

        for(var i = 0; i < op.length; i++) {
            var c = op[i];
            if(c.p == null)
                c.p = [];
            json.append(newOp,c);
        }

        return newOp;
    };

    // Returns true if an op at otherPath may affect an op at path
    json.canOpAffectOp = function(otherPath,path) {
        if(otherPath.length === 0)
            return true;

        if(path.length === 0)
            return false;

        path = path.slice(0,path.length - 1);
        otherPath = otherPath.slice(0,otherPath.length - 1);

        for(var i = 0; i < otherPath.length; i++) {
            var p = otherPath[i];
            if(i >= path.length)
                return false;
            if(p != path[i])
                return false;
        }

        // Same
        return true;
    };

    // transform c so it applies to a document with otherC applied.
    json.transformComponent = function(dest, c, otherC, type) {
        var common,common2,oc,from,to;

        c = clone(c);

        if(isDefined(c.na))
            c.p.push(0);

        if(isDefined(otherC.na))
            otherC.p.push(0);

        if(json.canOpAffectOp(otherC.p, c.p))
            common = otherC.p.length - 1;

        if(json.canOpAffectOp(c.p,otherC.p))
            common2 = c.p.length - 1;

        var cplength = c.p.length;
        var otherCplength = otherC.p.length;

        if(isDefined(c.na)) // hax
            c.p.pop();

        if(isDefined(otherC.na))
            otherC.p.pop();

        if(otherC.na) {
            if(common2 != null && otherCplength >= cplength && otherC.p[common2] == c.p[common2]) {
                if(isDefined(c.ld)) {
                    oc = clone(otherC);
                    oc.p = oc.p.slice(cplength);
                    c.ld = json.apply(clone(c.ld),[oc]);
                }
                else if(isDefined(c.od)) {
                    oc = clone(otherC);
                    oc.p = oc.p.slice(cplength);
                    c.od = json.apply(clone(c.od),[oc]);
                }
            }
            json.append(dest,c);
            return dest;
        }

        // if c is deleting something, and that thing is changed by otherC, we need to
        // update c to reflect that change for invertibility.
        // TODO this is probably not needed since we don't have invertibility
        if(common2 != null && otherCplength > cplength && c.p[common2] == otherC.p[common2]) {
            if(isDefined(c.ld)) {
                oc = clone(otherC);
                oc.p = oc.p.slice(cplength);
                c.ld = json.apply(clone(c.ld),[oc]);
            }
            else if(isDefined(c.od)) {
                oc = clone(otherC);
                oc.p = oc.p.slice(cplength);
                c.od = json.apply(clone(c.od),[oc]);
            }
        }

        if(common != null) {
            var commonOperand = cplength == otherCplength;

            // transform based on otherC
            if(isDefined(otherC.na)) {
                // this case is handled above due to icky path hax
            }
            else if(isDefined(otherC.si) || isDefined(otherC.sd)) {
                // String op vs string op - pass through to text type
                if(isDefined(c.si) || isDefined(c.sd)) {
                    if(!commonOperand)
                        throw new Error('must be a string?');

                    // Convert an op component to a text op component
                    var convert = function(component) {
                        var newC = {
                            p: component.p[component.p.length-1]
                        };
                        if(component.si != null) {
                            newC.i = component.si;
                        } else {
                            newC.d = component.sd;
                        }
                        return newC;
                    };

                    var tc1 = convert(c);
                    var tc2 = convert(otherC);

                    var res = [];

                    text._tc(res,tc1,tc2,type);
                    for(var i = 0; i < res.length; i++) {
                        var tc = res[i];
                        var jc = {
                            p: c.p.slice(0,common)
                        };
                        jc.p.push(tc.p);
                        if(tc.i != null)
                            jc.si = tc.i;
                        if(tc.d != null)
                            jc.sd = tc.d;
                        json.append(dest,jc);
                    }
                    return dest;
                }
            }
            else if(isDefined(otherC.li) && isDefined(otherC.ld)) {
                if(otherC.p[common] === c.p[common]) {
                    // noop

                    if(!commonOperand) {
                        return dest;
                    }
                    else if(isDefined(c.ld)) {
                        // we're trying to delete the same element, -> noop
                        if(isDefined(c.li) && type === 'left') {
                            // we're both replacing one element with another. only one can survive
                            c.ld = clone(otherC.li);
                        } else {
                            return dest;
                        }
                    }
                }
            }
            else if(isDefined(otherC.li)) {
                if(isDefined(c.li) && isUndefined(c.ld) && commonOperand && c.p[common] === otherC.p[common]) {
                    // in li vs. li, left wins.
                    if(type === 'right')
                        c.p[common]++;
                }
                else if(otherC.p[common] <= c.p[common]) {
                    c.p[common]++;
                }

                if(isDefined(c.lm)) {
                    if(commonOperand) {
                        // otherC edits the same list we edit
                        if(otherC.p[common] <= c.lm)
                            c.lm++;
                        // changing c.from is handled above.
                    }
                }
            }
            else if(isDefined(otherC.ld)) {
                if(isDefined(c.lm)) {
                    if(commonOperand) {
                        if(otherC.p[common] === c.p[common]) {
                            // they deleted the thing we're trying to move
                            return dest;
                        }
                        // otherC edits the same list we edit
                        var p = otherC.p[common];
                        from = c.p[common];
                        to = c.lm;
                        if(p < to || (p === to && from < to))
                            c.lm--;

                    }
                }

                if(otherC.p[common] < c.p[common]) {
                    c.p[common]--;
                }
                else if(otherC.p[common] === c.p[common]) {
                    if(otherCplength < cplength) {
                        // we're below the deleted element, so -> noop
                        return dest;
                    }
                    else if(isDefined(c.ld)) {
                        if(isDefined(c.li)) {
                            // we're replacing, they're deleting. we become an insert.
                            delete c.ld;
                        } else {
                            // we're trying to delete the same element, -> noop
                            return dest;
                        }
                    }
                }

            }
            else if(isDefined(otherC.lm)) {
                if(isDefined(c.lm) && cplength === otherCplength) {
                    // lm vs lm, here we go!
                    from = c.p[common];
                    to = c.lm;
                    var otherFrom = otherC.p[common];
                    var otherTo = otherC.lm;
                    if(otherFrom !== otherTo) {
                        // if otherFrom == otherTo, we don't need to change our op.

                        // where did my thing go?
                        if(from === otherFrom) {
                            // they moved it! tie break.
                            if(type === 'left') {
                                c.p[common] = otherTo;
                                if(from === to) // ugh
                                    c.lm = otherTo;
                            } else {
                                return dest;
                            }
                        } else {
                            // they moved around it
                            if(from > otherFrom)
                                c.p[common]--;
                            if(from > otherTo) {
                                c.p[common]++;
                            } else if(from === otherTo) {
                                if(otherFrom > otherTo) {
                                    c.p[common]++;
                                    if(from === to) // ugh, again
                                        c.lm++;
                                }
                            }

                            // step 2: where am i going to put it?
                            if(to > otherFrom) {
                                c.lm--;
                            } else if(to === otherFrom) {
                                if(to > from)
                                    c.lm--;
                            }
                            if(to > otherTo) {
                                c.lm++;
                            } else if(to === otherTo) {
                                // if we're both moving in the same direction, tie break
                                if((otherTo > otherFrom && to > from) ||
                                        (otherTo < otherFrom && to < from)) {
                                    if(type === 'right')
                                        c.lm++;
                                } else {
                                    if(to > from)
                                        c.lm++;
                                    else if(to === otherFrom)
                                        c.lm--;
                                }
                            }
                        }
                    }
                }
                else if(isDefined(c.li) && isUndefined(c.ld) && commonOperand) {
                    // li
                    from = otherC.p[common];
                    to = otherC.lm;
                    p = c.p[common];
                    if(p > from)
                        c.p[common]--;
                    if(p > to)
                        c.p[common]++;
                }
                else {
                    // ld, ld+li, si, sd, na, oi, od, oi+od, any li on an element beneath
                    // the lm
                    //
                    // i.e. things care about where their item is after the move.
                    from = otherC.p[common];
                    to = otherC.lm;
                    p = c.p[common];
                    if(p === from) {
                        c.p[common] = to;
                    } else {
                        if(p > from)
                            c.p[common]--;
                        if(p > to) {
                            c.p[common]++;
                        } else if(p === to) {
                            if(from > to)
                                c.p[common]++;
                        }
                    }
                }
            }
            else if(isDefined(otherC.oi) && isDefined(otherC.od)) {
                if(c.p[common] === otherC.p[common]) {
                    if(isDefined(c.oi) && commonOperand) {
                        // we inserted where someone else replaced
                        if(type === 'right') {
                            // left wins
                            return dest;
                        } else {
                            // we win, make our op replace what they inserted
                            c.od = otherC.oi;
                        }
                    } else {
                        // -> noop if the other component is deleting the same object (or any parent)
                        return dest;
                    }
                }
            }
            else if(isDefined(otherC.oi)) {
                if(isDefined(c.oi) && c.p[common] === otherC.p[common]) {
                    // left wins if we try to insert at the same place
                    if(type === 'left') {
                        json.append(dest,{p: c.p, od:otherC.oi});
                    } else {
                        return dest;
                    }
                }
            }
            else if(isDefined(otherC.od)) {
                if(c.p[common] == otherC.p[common]) {
                    if(!commonOperand)
                        return dest;
                    if(isDefined(c.oi)) {
                        delete c.od;
                    } else {
                        return dest;
                    }
                }
            }
        }

        json.append(dest,c);
        return dest;
    };

    if(typeof window !== "undefined" && window !== null) {
        // This is kind of awful - come up with a better way to hook this helper code up.
        exports._bootstrapTransform(json, json.transformComponent, json.checkValidOp, json.append);
    } else {
        require('./helpers')._bootstrapTransform(json, json.transformComponent, json.checkValidOp, json.append);
    }

    module.exports = json;

}).call(this);
