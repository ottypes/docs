// These methods let you build a transform function from a transformComponent function
// for OT types like JSON in which operations are lists of components and transforming them
// requires N^2 work. I find it kind of nasty that I need this, but I'm not really sure
// what a better solution is. Maybe I should do this automatically to types that don't have
// a compose function defined.

// Add transform and transformX functions for an OT type which has transformComponent defined.
// transformComponent(destination array, component, other component, side)
exports._bootstrapTransform = function (type, transformComponent, checkValidOp, append) {

  var transformComponentX = function (left, right, destLeft, destRight) {
    transformComponent(destLeft, left, right, 'left');
    transformComponent(destRight, right, left, 'right');
  };

  // Transforms rightOp by leftOp. Returns ['rightOp', clientOp']
  var transformX = function (leftOp, rightOp) {
    checkValidOp(leftOp);
    checkValidOp(rightOp);

    var newRightOp = [];

    for (var i = 0; i < rightOp.length; i++) {
      var rightComponent = rightOp[i];

      // Generate newLeftOp by composing leftOp by rightComponent
      var newLeftOp = [];

      var k = 0;
      while (k < leftOp.length) {
        var nextC = [];
        transformComponentX(leftOp[k], rightComponent, newLeftOp, nextC);
        k++;

        if (nextC.length === 1) {
          rightComponent = nextC[0];
        } else if (nextC.length === 0) {
          var tmp = leftOp.slice(k);
          for (var j = 0; j < tmp.length; j++) {
            append(newLeftOp, tmp[j]);
          }
          rightComponent = null;
          break;
        } else {
          // Recurse
          var ret = transformX(leftOp.slice(k), nextC);
          var l_ = ret[0];
          var r_ = ret[1];
          for (var j = 0; j < l_.length; j++) {
            append(newLeftOp, l_[j]);
          }
          for (var j = 0; j < r_.length; j++) {
            append(newRightOp, r_[j]);
          }
          rightComponent = null;
          break;
        }
      }

      if (rightComponent != null) {
        append(newRightOp, rightComponent);
      }

      leftOp = newLeftOp;
    }

    return [leftOp, newRightOp];
  };

  type.transformX = transformX;

  type.transform = function (op, otherOp, type) {
    if (type !== 'left' && type !== 'right') {
      throw new Error("type must be 'left' or 'right'");
    }

    if (otherOp.length === 0)
      return op;

    if (op.length === 1 && otherOp.length === 1) {
      return transformComponent([], op[0], otherOp[0], type);
    }

    if (type === 'left') {
      return transformX(op, otherOp)[0];
    } else {
      return transformX(otherOp, op)[1];
    }
  };

};
